# Boom Bíblico — Diseño de la Aplicación

**Fecha:** 2026-07-10  
**Estado:** Aprobado

---

## Resumen

Aplicación web de competencia bíblica para uso en iglesia. Los participantes estudian capítulos de la Biblia durante la semana y los sábados compiten en equipos respondiendo preguntas. La app corre en una laptop y se proyecta en un televisor en la sala de la iglesia.

---

## Arquitectura

**Stack:** Vite + React + TypeScript · Tailwind CSS · React Router · BroadcastChannel API · localStorage

Dos vistas que corren en el mismo servidor local (`npm run dev`), cada una en una pestaña/ventana del browser:

- `localhost:5173/operator` — Vista de control (laptop del operador)
- `localhost:5173/display` — Vista pública proyectada en el TV

Las dos vistas se sincronizan en tiempo real via **BroadcastChannel API**, que funciona entre pestañas del mismo origen sin necesidad de internet. El operador envía eventos de estado; la vista del TV los escucha y reacciona.

La app funciona **100% offline**. Solo requiere Node.js instalado en la laptop.

---

## Modelo de Datos

Todo persiste en **localStorage**, organizado por sesión de libro bíblico. Las preguntas no se persisten — se cargan desde un archivo JSON cada sábado.

### BookSession
```ts
{
  bookName: string      // nombre del libro (ej: "Génesis")
  startDate: string     // fecha ISO de inicio
  isActive: boolean
}
```

### Team
```ts
{
  id: string
  name: string
  captainId: string     // id de un Participant
  members: Participant[]
}
```

### Participant
```ts
{
  id: string
  name: string
  teamId: string
}
```

### Question (desde JSON, no persiste)
```ts
{
  id: string
  question: string
  options: { text: string; isCorrect: boolean }[]
}
```

### Score
```ts
{
  participantId: string
  teamId: string
  correct: number
  incorrect: number
}
```
El puntaje del equipo se calcula como la suma de respuestas correctas de todos sus miembros. Las respuestas incorrectas no restan puntos.

### Turn (registro por turno)
```ts
{
  participantId: string
  teamId: string
  date: string           // fecha ISO del turno
  questionId: string     // pregunta asignada
  questionText: string   // texto completo de la pregunta
  answeredCorrectly: boolean
}
```
Las preguntas ya usadas se derivan de los `questionId` de todos los `Turn` guardados — no hay campo separado.

---

## Persistencia por Libro

La unidad de persistencia es el **libro bíblico**. Todos los datos (equipos, participantes, puntajes, historial de turnos) se acumulan a lo largo de múltiples sábados mientras dura el libro. Al terminar el libro, se limpia el localStorage y se configura un nuevo libro desde cero.

---

## Configuración de Equipos y Participantes

**Opción híbrida:** los equipos y participantes se pueden:
1. Crear manualmente desde la UI de configuración del operador
2. Importar desde un archivo JSON con la siguiente estructura:

```json
{
  "teams": [
    {
      "name": "Equipo Alfa",
      "captain": "Juan Pérez",
      "members": ["Juan Pérez", "María González", "Carlos M.", "Ana L."]
    }
  ]
}
```

---

## Formato de Preguntas (JSON)

```json
[
  {
    "id": "q1",
    "question": "¿Cuántos años tenía Noé cuando comenzó a construir el arca?",
    "options": [
      { "text": "400 años", "isCorrect": false },
      { "text": "500 años", "isCorrect": false },
      { "text": "600 años", "isCorrect": true },
      { "text": "700 años", "isCorrect": false }
    ]
  }
]
```

---

## Flujo de la Competencia

### Fase 1 — Configuración (una vez por libro)
1. Cargar archivo JSON de preguntas via File Picker
2. Configurar equipos y participantes (UI manual o importar JSON)
3. Iniciar sesión: ingresar nombre del libro, confirmar

### Fase 2 — Ronda de competencia (se repite cada turno)
1. Operador selecciona el equipo que juega
2. Sistema selecciona participante aleatoriamente:
   - Prioridad: quienes **no han pasado hoy**
   - Si todos pasaron hoy: quienes pasaron hace más tiempo (o nunca en el libro)
3. Sistema selecciona pregunta aleatoria no usada (no presente en el historial de Turn)
4. TV muestra: nombre del participante, equipo, pregunta y opciones (sin indicar cuál es correcta)
5. Operador registra la respuesta elegida por el participante (click en la opción)
6. TV revela resultado: ✓ Correcto o ✗ Incorrecto + muestra la respuesta correcta
7. Puntaje actualizado en tiempo real en el marcador del TV
8. Turn guardado en localStorage
9. Operador presiona "Siguiente turno" → volver al paso 1

### Fase 3 — Cierre de libro
1. Operador finaliza la sesión
2. TV muestra marcador final completo
3. localStorage se limpia para iniciar el próximo libro

---

## Vistas

### Vista Operador (`/operator`)

Tres paneles:

- **Sidebar izquierdo:** lista de equipos con puntaje acumulado, libro activo, botón de configuración
- **Panel central:** participante activo, pregunta con opciones seleccionables, botón "Confirmar respuesta"
- **Panel derecho:** lista de participantes del equipo activo con estado (✓ ya pasó hoy / ▶ turno actual / ○ pendiente)

### Vista TV (`/display`)

Full-screen, optimizada para proyección. Estados:

1. **Pregunta activa:** nombre y equipo del participante, pregunta, opciones A/B/C/D sin marcar correcta, marcador de equipos al pie
2. **Resultado correcto:** ✅ "¡CORRECTO!", resalta la respuesta correcta, muestra "+1 punto para [Equipo]", marcador actualizado
3. **Resultado incorrecto:** ❌ "Respuesta incorrecta", muestra cuál era la respuesta correcta

---

## Sincronización entre Vistas (BroadcastChannel)

El operador envía mensajes al canal `boom-biblico` con el estado del turno. La vista del TV escucha y renderiza. Estructura de mensajes:

```ts
type DisplayEvent =
  | { type: 'IDLE' }
  | { type: 'SHOW_QUESTION'; participant: Participant; team: Team; question: Question }
  | { type: 'REVEAL_ANSWER'; selectedOptionIndex: number; correct: boolean; correctOptionIndex: number }
  | { type: 'UPDATE_SCORES'; scores: Score[] }
  | { type: 'SHOW_FINAL_SCORES'; scores: Score[] }
```

---

## Componentes Principales

```
src/
  pages/
    OperatorPage.tsx      # vista /operator
    DisplayPage.tsx       # vista /display
  components/
    operator/
      TeamSidebar.tsx
      QuestionPanel.tsx
      ParticipantPanel.tsx
      SetupScreen.tsx
    display/
      QuestionView.tsx
      ResultView.tsx
      Scoreboard.tsx
  lib/
    storage.ts            # helpers de localStorage
    broadcast.ts          # BroadcastChannel wrapper
    randomizer.ts         # selección aleatoria de participante/pregunta
    types.ts              # definiciones TypeScript
```

---

## Decisiones Técnicas

| Decisión | Elección | Razón |
|---|---|---|
| Framework | Vite + React + TypeScript | Moderno, rápido, tipado |
| Estilos | Tailwind CSS | Utilidades, fácil de mantener |
| Persistencia | localStorage | Sin servidor, 100% offline |
| Sincronización | BroadcastChannel API | Nativo del browser, sin dependencias |
| Routing | React Router | Dos rutas: /operator y /display |
| Preguntas | JSON vía File Picker | Formato simple, sin base de datos |
