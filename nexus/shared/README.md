# @interrealm/nexus-shared

Shared types, schemas, and DTOs for InterRealm Nexus Console and Server.

## Overview

This package contains:

- **TypeScript Types**: Generated from YAML schemas in `/core/schemas`
- **Zod Schemas**: Runtime validation schemas
- **DTOs**: Data Transfer Objects for API contracts between console and server

## Installation

This is a local workspace package. Reference it in your package.json:

```json
{
  "dependencies": {
    "@interrealm/nexus-shared": "file:../shared"
  }
}
```

## Usage

### Importing Types

```typescript
import { Realm, Member, RealmType } from '@interrealm/nexus-shared';
```

### Using Zod Schemas for Validation

```typescript
import { CreateRealmDTOSchema } from '@interrealm/nexus-shared';

const result = CreateRealmDTOSchema.safeParse(data);
if (result.success) {
  // data is valid
} else {
  // validation errors in result.error
}
```

### Using DTOs

```typescript
import { CreateRealmDTO, RealmResponseDTO } from '@interrealm/nexus-shared';

// In Express controllers
app.post('/api/realms', async (req, res) => {
  const dto: CreateRealmDTO = CreateRealmDTOSchema.parse(req.body);
  // ... process realm creation
});
```

## Development

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run dev
```

### Regenerate Types

```bash
npm run generate:types
```

## Schema Sources

Types are generated from:

- `/core/schemas/mesh-config.schema.yaml` → Realm, Member, Policy types
- `/core/schemas/capability.yaml` → Capability, Service, Loop types

## Type Safety

This package ensures type safety between:

1. Console UI forms → API requests
2. Server API endpoints → Database models
3. Server → Console API responses

All shared types have corresponding Zod validation schemas for runtime type checking.
