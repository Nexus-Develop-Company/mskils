# 📋 Guía de Instalación y Comandos

## Instalación completa

```bash
npx @nexusdevelop/mskills
```

Pregunta si deseas instalación global o local.

## Instalación específica de agente

```bash
npx @nexusdevelop/mskills agent backend
```

Instala el agente y sus skills (carpetas `/SKILL.md`) automáticamente.

## Instalación específica de skill

```bash
npx @nexusdevelop/mskills skill nest-mastery
```

Solo descarga la carpeta `/SKILL.md` de la skill.

## Desinstalación completa

```bash
npx @nexusdevelop/mskills uninstall
```

Borra todo rastro de mskills.

## Desinstalación de agente

```bash
npx @nexusdevelop/mskills uninstall agent backend
```

Borra el agente y las skills huérfanas que no use otro agente.

## Desinstalación de skill

```bash
npx @nexusdevelop/mskills uninstall skill nest-mastery
```

Prohíbe borrar si un agente la usa.

## Ejemplos de uso

Seleccionar agente con Tab en OpenCode y dar la orden.
