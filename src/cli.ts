#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import os from 'os';

// Interfaces para tipado estricto
interface AgentData {
  instructions?: string;
  skills?: string[];
}

interface OpenCodeConfig {
  "$schema"?: string;
  agent?: Record<string, AgentData>;
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const prompt = (query: string): Promise<string> => new Promise((resolve) => rl.question(query, resolve));

// Rutas dinámicas según SO
const isWindows = process.platform === 'win32';
const globalConfigDir = isWindows ? path.join(process.env.APPDATA || '', 'opencode') : path.join(os.homedir(), '.config', 'opencode');
const localConfigDir = path.join(process.cwd(), '.opencode');

const skillsSourceDir = path.join(__dirname, '..', 'skills');
const agentsSourceDir = path.join(__dirname, '..', 'agents');
const baseConfigFile = path.join(__dirname, '..', 'base.json');
const PREFIX = 'mskills-';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const subCommand = args[1];
  const target = args[2];

  console.log('\n🚀 MSKILLS - Dopando tu OpenCode...\n');

  if (command === 'agent') {
    if (!subCommand) console.log('❌ Debes especificar el agente. Ejemplo: npx mskills agent backend');
    else await installAgent(subCommand);
  } else if (command === 'skill') {
    if (!subCommand) console.log('❌ Debes especificar la skill. Ejemplo: npx mskills skill nest-mastery');
    else await installSingleSkill(subCommand);
  } else if (command === 'uninstall') {
    await handleUninstall(subCommand, target);
  } else {
    await installAll();
  }

  rl.close();
}

async function askScope(): Promise<'global' | 'local'> {
  const scope = await prompt('¿Dónde quieres operar? (global / local): ');
  return scope.toLowerCase() === 'local' ? 'local' : 'global';
}

function getConfigPath(scope: 'global' | 'local'): string {
  return scope === 'global' ? path.join(globalConfigDir, 'opencode.json') : path.join(process.cwd(), 'opencode.json');
}

function getSkillsDestDir(scope: 'global' | 'local'): string {
  return scope === 'global' ? path.join(globalConfigDir, 'skills') : path.join(localConfigDir, 'skills');
}

function ensurePrefixOnSkills(agentData: AgentData): AgentData {
  if (agentData.skills) {
    agentData.skills = agentData.skills.map(skill => skill.startsWith(PREFIX) ? skill : `${PREFIX}${skill}`);
  }
  return agentData;
}

function getOrCreateConfig(configFile: string): OpenCodeConfig {
  try {
    if (fs.existsSync(configFile)) return JSON.parse(fs.readFileSync(configFile, 'utf8'));
  } catch (error) {
    console.log('⚠️ Tu opencode.json estaba malformado. Se recreará la base.');
  }
  if (fs.existsSync(baseConfigFile)) return JSON.parse(fs.readFileSync(baseConfigFile, 'utf8'));
  return { "$schema": "https://opencode.ai/config.json", "agent": {} };
}

function saveConfigSafely(configFile: string, config: OpenCodeConfig): void {
  fs.mkdirSync(path.dirname(configFile), { recursive: true });
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
}

// OBTENER SKILLS USADAS POR AGENTES MSKILLS (Excluyendo uno opcionalmente)
function getUsedMskillsSkills(config: OpenCodeConfig, excludeAgentName?: string): Set<string> {
  const usedSkills = new Set<string>();
  if (config.agent) {
    for (const [agentKey, agentData] of Object.entries(config.agent)) {
      if (agentKey.startsWith(PREFIX) && agentKey !== excludeAgentName && agentData.skills) {
        agentData.skills.forEach(skill => usedSkills.add(skill));
      }
    }
  }
  return usedSkills;
}

// ==========================================
// FUNCIONES DE INSTALACIÓN
// ==========================================

async function installSingleSkill(skillName: string) {
  const scope = await askScope();
  const destDir = getSkillsDestDir(scope);
  const sourceFile = path.join(skillsSourceDir, `${skillName}.md`);
  if (!fs.existsSync(sourceFile)) {
    console.log(`❌ Skill "${skillName}" no encontrada en el repositorio.`);
    return;
  }
  fs.mkdirSync(destDir, { recursive: true });
  const finalFileName = `${PREFIX}${skillName}.md`;
  fs.copyFileSync(sourceFile, path.join(destDir, finalFileName));
  console.log(`✅ Skill instalada en ${scope}: ${finalFileName}`);
}

async function installAgent(agentName: string) {
  const scope = await askScope();
  const configFile = getConfigPath(scope);
  const agentFile = path.join(agentsSourceDir, `${agentName}.json`);
  if (!fs.existsSync(agentFile)) {
    console.log(`❌ Agente "${agentName}" no encontrado en el repositorio.`);
    return;
  }

  let agentFragment: AgentData = JSON.parse(fs.readFileSync(agentFile, 'utf8'));
  agentFragment = ensurePrefixOnSkills(agentFragment);

  let config = getOrCreateConfig(configFile);
  // Fix TS: Extraemos con fallback y reasignamos al final
  const agentObj = config.agent || {}; 

  const finalAgentName = `${PREFIX}${agentName}`;
  agentObj[finalAgentName] = agentFragment;
  config.agent = agentObj; // Reasignación segura
  
  saveConfigSafely(configFile, config);
  console.log(`✅ Agente "${finalAgentName}" configurado en ${scope}.`);

  if (agentFragment.skills && agentFragment.skills.length > 0) {
    const destSkillsDir = getSkillsDestDir(scope);
    fs.mkdirSync(destSkillsDir, { recursive: true });
    let skillsInstalled = 0;
    agentFragment.skills.forEach(prefixedSkillName => {
      const originalSkillName = prefixedSkillName.replace(PREFIX, '');
      const sourceFile = path.join(skillsSourceDir, `${originalSkillName}.md`);
      if (fs.existsSync(sourceFile)) {
        fs.copyFileSync(sourceFile, path.join(destSkillsDir, `${prefixedSkillName}.md`));
        skillsInstalled++;
      }
    });
    console.log(`   -> ${skillsInstalled} Skills dependientes instaladas automáticamente.`);
  }
}

async function installAll() {
  const scope = await askScope();
  const destSkillsDir = getSkillsDestDir(scope);
  const configFile = getConfigPath(scope);

  fs.mkdirSync(destSkillsDir, { recursive: true });
  const skills = fs.readdirSync(skillsSourceDir).filter((f: string) => f.endsWith('.md'));
  skills.forEach((file: string) => {
    fs.copyFileSync(path.join(skillsSourceDir, file), path.join(destSkillsDir, `${PREFIX}${file}`));
  });
  console.log(`✅ ${skills.length} Skills instaladas en ${scope} (con prefijo ${PREFIX}).`);

  let config = getOrCreateConfig(configFile);
  // Fix TS: Extraemos con fallback y reasignamos al final
  const agentObj = config.agent || {};
  const agents = fs.readdirSync(agentsSourceDir).filter((f: string) => f.endsWith('.json'));

  agents.forEach((file: string) => {
    const agentName = file.replace('.json', '');
    let agentFragment: AgentData = JSON.parse(fs.readFileSync(path.join(agentsSourceDir, file), 'utf8'));
    agentFragment = ensurePrefixOnSkills(agentFragment);
    agentObj[`${PREFIX}${agentName}`] = agentFragment;
  });

  config.agent = agentObj; // Reasignación segura

  saveConfigSafely(configFile, config);
  console.log(`✅ ${agents.length} Agentes configurados en ${scope} (con prefijo ${PREFIX}).`);
  console.log('\n🔥 ¡OpenCode dopado al máximo! Reinicia tu terminal si estaba abierta.\n');
}

// ==========================================
// FUNCIONES DE DESINSTALACIÓN
// ==========================================

async function handleUninstall(subCommand?: string, target?: string) {
  if (!subCommand || subCommand === 'all') {
    await uninstallAll();
  } else if (subCommand === 'agent') {
    if (!target) console.log('❌ Especifica el agente. Ejemplo: npx mskills uninstall agent backend');
    else await uninstallAgent(target);
  } else if (subCommand === 'skill') {
    if (!target) console.log('❌ Especifica la skill. Ejemplo: npx mskills uninstall skill nest-mastery');
    else await uninstallSkill(target);
  } else {
    console.log('❌ Comando no reconocido. Usa: uninstall [all | agent <nombre> | skill <nombre>]');
  }
}

async function uninstallAll() {
  const scope = await askScope();
  const configFile = getConfigPath(scope);
  const destSkillsDir = getSkillsDestDir(scope);

  console.log(`\n🗑️ Eliminando TODOS los MSKILLS de tu configuración ${scope}...\n`);

  if (fs.existsSync(destSkillsDir)) {
    const files = fs.readdirSync(destSkillsDir).filter((f: string) => f.startsWith(PREFIX) && f.endsWith('.md'));
    files.forEach((file: string) => fs.unlinkSync(path.join(destSkillsDir, file)));
    console.log(`✅ ${files.length} Skills con prefijo ${PREFIX} eliminadas.`);
  }

  if (fs.existsSync(configFile)) {
    let config: OpenCodeConfig = getOrCreateConfig(configFile);
    // Fix TS: Extraemos con fallback para que TS no se queje dentro de los callbacks
    const agentObj = config.agent || {}; 
    
    const keysToRemove = Object.keys(agentObj).filter(key => key.startsWith(PREFIX));
    keysToRemove.forEach(key => delete agentObj[key]);
    
    config.agent = agentObj; // Reasignación segura
    saveConfigSafely(configFile, config);
    console.log(`✅ ${keysToRemove.length} Agentes con prefijo ${PREFIX} eliminados de opencode.json.`);
  }
  console.log('\n🧹 Limpieza completada. Tu OpenCode vuelve a la normalidad.\n');
}

async function uninstallAgent(agentName: string) {
  const scope = await askScope();
  const configFile = getConfigPath(scope);
  const destSkillsDir = getSkillsDestDir(scope);
  const finalAgentName = agentName.startsWith(PREFIX) ? agentName : `${PREFIX}${agentName}`;

  console.log(`\n🗑️ Eliminando Agente ${finalAgentName}...\n`);

  if (!fs.existsSync(configFile)) {
    console.log('❌ No se encontró opencode.json.');
    return;
  }

  let config: OpenCodeConfig = getOrCreateConfig(configFile);
  
  // Fix TS: Si no existe el agente, nos salimos
  if (!config.agent || !config.agent[finalAgentName]) {
    console.log(`❌ El agente ${finalAgentName} no existe en tu configuración.`);
    return;
  }

  // Fix TS: Extraemos el objeto aquí. TS ya sabe que no es undefined porque hicimos el return arriba.
  const agentObj = config.agent;
  const agentSkills = agentObj[finalAgentName].skills || [];
  
  delete agentObj[finalAgentName]; // Borramos el agente
  saveConfigSafely(configFile, config);
  console.log(`✅ Agente ${finalAgentName} eliminado del JSON.`);

  // Comprobar skills huérfanas
  const usedByOthers = getUsedMskillsSkills(config, finalAgentName);
  let deletedSkillsCount = 0;

  agentSkills.forEach(skillName => {
    if (!usedByOthers.has(skillName)) {
      const skillFile = path.join(destSkillsDir, `${skillName}.md`);
      if (fs.existsSync(skillFile)) {
        fs.unlinkSync(skillFile);
        deletedSkillsCount++;
      }
    }
  });

  if (deletedSkillsCount > 0) console.log(`✅ ${deletedSkillsCount} Skills huérfanas eliminadas (ningún otro agente las usaba).`);
  else console.log(`ℹ️ Las skills de este agente aún están en uso por otros agentes mskills.`);
}

async function uninstallSkill(skillName: string) {
  const scope = await askScope();
  const configFile = getConfigPath(scope);
  const destSkillsDir = getSkillsDestDir(scope);
  const finalSkillName = skillName.startsWith(PREFIX) ? skillName : `${PREFIX}${skillName}`;

  console.log(`\n🗑️ Intentando eliminar Skill ${finalSkillName}...\n`);

  if (fs.existsSync(configFile)) {
    let config: OpenCodeConfig = getOrCreateConfig(configFile);
    const usedBy = getUsedMskillsSkills(config);
    
    if (usedBy.has(finalSkillName)) {
      console.log(`❌ PROHIBIDO: La skill "${finalSkillName}" está siendo usada por uno o más agentes mskills. Elimina primero esos agentes.`);
      return;
    }
  }

  const skillFile = path.join(destSkillsDir, `${finalSkillName}.md`);
  if (fs.existsSync(skillFile)) {
    fs.unlinkSync(skillFile);
    console.log(`✅ Skill ${finalSkillName}.md eliminada correctamente.`);
  } else {
    console.log(`❌ La skill ${finalSkillName}.md no existe en la carpeta.`);
  }
}

main();