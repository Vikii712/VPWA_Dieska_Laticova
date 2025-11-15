import { defineStore } from 'pinia';
import { ref, unref } from 'vue'

interface User {
  id: number;
  nick: string;
  name: string;
  lastName: string;
  email: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  nick: string;
  name: string;
  lastName: string;
  email: string;
  password: string;
}

interface ValidationError {
  field: string;
  message: string;
  rule: string;
}

interface ApiErrorResponse {
  errors?: ValidationError[];
  message?: string;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function api(method: string, url: string, payload?: unknown): Promise<any> {
    const response = await fetch(`http://localhost:3333${url}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`
      },
      body: method !== 'GET' && payload ? JSON.stringify(unref(payload)) : null
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`API error on ${method} ${url}:`, data);

      const errorData = data as ApiErrorResponse;

      // Nesprávne prihlasovacie údaje
      if (response.status === 400 || response.status === 401) {
        throw new Error('Invalid email or password');
      }

      // Validačné chyby z VineJS
      if (errorData.errors && Array.isArray(errorData.errors)) {
        // Kontrola duplicitného emailu pri registrácii
        const emailError = errorData.errors.find((err: ValidationError) =>
          err.field === 'email' && err.rule === 'database.unique'
        );
        if (emailError) {
          throw new Error('This email has already been taken. Please use another email or try signing in.');
        }

        // Iné validačné chyby
        const errorMessages = errorData.errors.map((err: ValidationError) => err.message).join(', ');
        throw new Error(errorMessages);
      }

      throw new Error(errorData.message || 'An error occurred');
    }

    return data;
  }

  function authenticate(result: AuthResponse) {
    token.value = result.token
    user.value = result.user
    localStorage.setItem('token', result.token)
  }

  async function login(payload: LoginPayload) {
    const result = await api('POST', '/login', payload) as AuthResponse
    authenticate(result)
  }

  async function register(payload: RegisterPayload) {
    const result = await api('POST', '/register', payload) as AuthResponse
    authenticate(result)
  }

  async function logout() {
    await api('DELETE', '/logout')
    token.value = null
    user.value = null
    localStorage.removeItem('token')
  }

  async function me() {
    const result = await api('GET', '/me') as { user: User }
    user.value = result.user
    return user.value
  }

  return { user, token, login, register, logout, me }
});
