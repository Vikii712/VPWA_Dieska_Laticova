import { unref } from 'vue'
import { useAuthStore } from 'stores/auth'


/* Funkcia api */

export async function api<T>(method: string, url: string, payload?: unknown) : Promise<T> {
  const auth = useAuthStore()

  const response = await fetch(`http://localhost:3333${url}`, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth.token}`
    },
    body: method !== 'GET' && payload ? JSON.stringify(unref(payload)) : null
  })

  const data = await response.json() as T | ApiErrorResponse

  if (!response.ok) {
    handleApiError(url, response.status, data as ApiErrorResponse)
  }

  return data as T
}



/*-----------------------------------*/
/* API druhy errorov a ich vypisy */

interface ValidationError {
  field: string;
  message: string;
  rule: string;
}

interface ApiErrorResponse {
  errors?: ValidationError[];
  message?: string;
}

export class ApiError extends Error {
  constructor(message: string, public status: number, public data?: unknown) {
    super(message)
    this.name = 'ApiError'
  }
}

function handleApiError(url: string, status: number, data: ApiErrorResponse): never {
  console.error(`API error on ${url}:`, data);

  if (url === '/login' && (status === 400 || status === 401)) {
    throw new ApiError('Invalid email or password', status, data);
  }

  if (url === '/register' && data.errors) {
    const emailError = data.errors.find((err: ValidationError) =>
      err.field === 'email' && err.rule === 'database.unique'
    );
    if (emailError) {
      throw new ApiError('This email has already been taken. Please use another email or try signing in.', status, data);
    }

    const nickError = data.errors.find((err: ValidationError) =>
      err.field === 'nick' && err.rule === 'database.unique'
    );
    if (nickError) {
      throw new ApiError('This nickname is already taken. Please choose another one.', status, data);
    }
  }

  // Handling pre channel errory
  if (url === '/channels' && status === 400 && data.message) {
    if (data.message.includes('private')) {
      throw new ApiError('This channel is private and you cannot join it.', status, data);
    }
    // Pre ostatné channel errory použi server správu
    throw new ApiError(data.message, status, data);
  }

  if (data.errors && Array.isArray(data.errors)) {
    const errorMessages = data.errors.map((err: ValidationError) => err.message).join(', ');
    throw new ApiError(errorMessages, status, data);
  }

  throw new ApiError(data.message || 'An error occurred', status, data);
}
