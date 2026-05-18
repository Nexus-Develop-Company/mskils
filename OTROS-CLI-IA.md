# 🤖 Uso de MSkills en otras IAs de Terminal

> ⚠️ **Aviso importante**: Compatibilidad no probada exhaustivamente. Guía teórica.

## Teoría

Todas las IAs de terminal leen archivos `.md` de contexto. MSkills está diseñado para ser compatible con cualquier IA que soporte esta mecánica. Cada skill es una carpeta con `SKILL.md` dentro.

## Claude Code

Usar `CLAUDE.md` referenciando la carpeta de skills o pegando contenido.

```markdown
# CLAUDE.md
Echa un vistazo a la carpeta ./mskills/ para contexto adicional de habilidades especializadas.
```

## Aider

Añadir las carpetas de skills al chat.

```bash
aider --file skill1/SKILL.md --file skill2/SKILL.md
```

## Cursor / Windsurf

Usar `.cursorrules` apuntando a los archivos `.md`.

```markdown
# .cursorrules
Echa un vistazo a los archivos en ./mskills/ cuando necesites contexto técnico especializado.
```

## OpenClaw / KimiCode

Si usan configuración similar a OpenCode, debería funcionar directo o buscar cómo inyectan `.md`.

---

**Nota**: Si encuentras que funciona en otras IAs, ¡contribuye documentándolo en COLABORADORES.md!
