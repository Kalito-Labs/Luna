// backend/types/api.ts
export const API_CONTRACT_VERSION = '1' as const;

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'FORBIDDEN'
  | 'INTERNAL';

export interface ApiErrorPayload {
  code: ApiErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  version: typeof API_CONTRACT_VERSION;
  error: ApiErrorPayload;
}

export interface ApiSuccessItem<T> {
  version: typeof API_CONTRACT_VERSION;
  data: T;
}

export interface ApiSuccessList<T> {
  version: typeof API_CONTRACT_VERSION;
  data: T[];
}

export interface ApiDeleted {
  version: typeof API_CONTRACT_VERSION;
  ok: true;
}
