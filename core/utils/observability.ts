
export type ErrorCategory = 'AUTH' | 'NETWORK' | 'BUILD' | 'VALIDATION' | 'DEPENDENCY';

export interface CorrelationContext {
  requestId: string;
  correlationId: string;
  authContext: string;
}

interface StructuredLog {
  timestamp?: string;
  component: string;
  operation: string;
  auth_context: string;
  request_id: string;
  correlation_id: string;
  error_code?: string;
  level?: 'INFO' | 'WARN' | 'ERROR';
  message?: string;
  details?: Record<string, unknown>;
}

export class StructuredError extends Error {
  constructor(
    public readonly category: ErrorCategory,
    message: string,
    public readonly status = 500,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'StructuredError';
  }

  toResponseBody(context: CorrelationContext) {
    return {
      success: false,
      error: this.message,
      category: this.category,
      requestId: context.requestId,
      correlationId: context.correlationId,
      details: this.details,
    };
  }
}

const makeId = () => {
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export function resolveCorrelationContext(
  headers: Headers,
  authHeader?: string | null
): CorrelationContext {
  const requestId = headers.get('x-request-id') || makeId();
  const correlationId = headers.get('x-correlation-id') || requestId;
  const authContext = authHeader?.startsWith('Bearer ') ? 'BEARER' : 'ANONYMOUS';

  return { requestId, correlationId, authContext };
}

export function logStructured(entry: StructuredLog): void {
  const payload: StructuredLog = {
    ...entry,
    timestamp: entry.timestamp || new Date().toISOString(),
    level: entry.level || 'INFO',
  };

  const line = JSON.stringify(payload);
  if (payload.level === 'ERROR') {
    console.error(line);
    return;
  }

  if (payload.level === 'WARN') {
    console.warn(line);
    return;
  }

  console.log(line);
}

export function mapUnknownError(error: unknown): StructuredError {
  if (error instanceof StructuredError) {
    return error;
  }

  if (error instanceof Error) {
    return new StructuredError('DEPENDENCY', error.message, 500);
  }

  return new StructuredError('DEPENDENCY', 'Unknown server error', 500);
}

export function withCorrelationHeaders(
  init: ResponseInit | undefined,
  context: CorrelationContext
): ResponseInit {
  return {
    ...init,
    headers: {
      ...(init?.headers || {}),
      'x-request-id': context.requestId,
      'x-correlation-id': context.correlationId,
    },
  };
}
