# 🤝 Guía de Contribución

## Filosofía

- **Calidad sobre cantidad**: Cada skill debe aportar valor real.
- **No duplicidad**: No crear skills que ya existan con otro nombre.
- **Seguridad primero**: Nunca incluir código que comprometa la seguridad.

## Cómo añadir una Skill

1. Fork del repositorio
2. Crear `skills/mi-skill.md` con estructura estricta:
   - **Rol**: Define el propósito
   - **Directrices**: Comportamiento esperado
   - **Output Obligatorio**: Formato de respuesta
   - **Anti-Patrones PROHIBIDOS**: Qué evitar
3. Actualizar `agents/x.json` si aplica

## Cómo añadir un Agente

1. Crear `agents/mi-agente.json`
2. Sin clave raíz (solo `instructions` y `skills` array)

## PR Process

1. Compilar con `npm run build`
2. Conventional Commits
3. PR detallado con justificación
