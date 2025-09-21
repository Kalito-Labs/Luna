# API Type Definitions

This file documents the type definitions found in `/backend/types/api.ts`.

## Overview

The `api.ts` file defines standardized API response formats and error codes for the Kalito application. These types ensure consistent API contracts across the platform.

## Constants

### API_CONTRACT_VERSION

```typescript
export const API_CONTRACT_VERSION = '1' as const;
```

A constant representing the current API contract version. Using it as a const assertion ensures type safety when used in other API contracts.

## Type Definitions

### ApiErrorCode

```typescript
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'FORBIDDEN'
  | 'INTERNAL';
```

A union type defining all possible error codes that can be returned by the API:

- `VALIDATION_ERROR`: Input validation failed
- `NOT_FOUND`: Requested resource not found
- `CONFLICT`: Request conflicts with current state
- `FORBIDDEN`: User lacks permission for the requested action
- `INTERNAL`: Internal server error

## Interfaces

### ApiErrorPayload

```typescript
export interface ApiErrorPayload {
  code: ApiErrorCode;
  message: string;
  details?: Record<string, unknown>;
}
```

Defines the structure of error information in API error responses:

- `code`: The specific error code (from `ApiErrorCode` type)
- `message`: Human-readable error message
- `details`: Optional object containing additional error details

### ApiErrorResponse

```typescript
export interface ApiErrorResponse {
  version: typeof API_CONTRACT_VERSION;
  error: ApiErrorPayload;
}
```

Defines the standard error response envelope:

- `version`: API contract version (always matches `API_CONTRACT_VERSION`)
- `error`: The error payload containing code, message, and optional details

### ApiSuccessItem

```typescript
export interface ApiSuccessItem<T> {
  version: typeof API_CONTRACT_VERSION;
  data: T;
}
```

Generic interface for successful API responses returning a single item:

- `version`: API contract version
- `data`: The response payload of generic type T

### ApiSuccessList

```typescript
export interface ApiSuccessList<T> {
  version: typeof API_CONTRACT_VERSION;
  data: T[];
}
```

Generic interface for successful API responses returning an array of items:

- `version`: API contract version
- `data`: Array of response payload items of generic type T

### ApiDeleted

```typescript
export interface ApiDeleted {
  version: typeof API_CONTRACT_VERSION;
  ok: true;
}
```

Interface for successful deletion responses:

- `version`: API contract version
- `ok`: Boolean flag confirming successful deletion (always true)

## Usage in the Codebase

The API types from this file are used throughout the application to maintain a consistent API contract:

1. In `/frontend/src/composables/usePersonaStore.ts`, the `ApiErrorResponse` type is imported for type checking error responses from the backend.

2. In the `/backend/types/personas.ts` file, these API response types are used to define specific response types for persona endpoints:

   ```typescript
   export type PersonaItemResponse = ApiSuccessItem<Persona>
   export type PersonaListResponse = ApiSuccessList<Persona>
   ```

This standardized API format ensures consistency across all endpoints and simplifies frontend handling of responses.