# AI Canvas Agent Module

This directory contains the core AI functionality for the canvas agent feature.

## Structure

```
src/lib/ai/
├── client.ts          # AI client abstraction layer (DirectOpenAI / APIRoute)
├── tools.ts           # OpenAI function tool definitions (Task 5)
├── agent.ts           # CanvasAIAgent class (Task 6)
├── layouts.ts         # Complex layout generators (Task 7)
├── executor.ts        # Function execution logic (Task 6.2)
└── reference.ts       # Object reference resolution (Task 2.1.4)
```

## Current Status

### ✅ Completed

- **client.ts**: Abstraction layer for OpenAI integration
  - DirectOpenAIClient (development)
  - APIRouteClient (production stub)

### 🚧 To Be Implemented

- **tools.ts**: Function definitions for OpenAI (Task 5)
- **agent.ts**: Main AI agent class (Task 6)
- **layouts.ts**: Login form, nav bar, etc. (Task 7)
- **executor.ts**: Execute AI function calls (Task 6.2)
- **reference.ts**: Find objects by description (Task 2.1.4)

## Usage

```typescript
import { aiClient } from "@/lib/ai/client";

// Get canvas context
const context = getCanvasContext();

// Process command
const response = await aiClient.processCommand(
  "Create a blue rectangle at 500, 500",
  context
);
```

## Development vs Production

**Development**: Uses `DirectOpenAIClient`

- Client-side OpenAI calls
- Faster iteration
- Requires `NEXT_PUBLIC_OPENAI_API_KEY`

**Production**: Uses `APIRouteClient`

- Server-side API route
- Secure API key
- Rate limiting

## References

- PRD: `Documentation/aiPRD.md`
- Tasks: `Documentation/aiTasks.md`
- Testing: `Documentation/aiTesting.md`
