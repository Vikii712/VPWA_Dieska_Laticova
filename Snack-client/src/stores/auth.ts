import { defineStore } from 'pinia';
import { ref } from 'vue'
import { api } from 'src/services/api'

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

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))

  function authenticate(result: AuthResponse) {
    token.value = result.token
    user.value = result.user
    localStorage.setItem('token', result.token)
  }

  async function login(payload: LoginPayload) {
    const result = await api<AuthResponse>('POST', '/login', payload)
    authenticate(result)
  }

  async function register(payload: RegisterPayload) {
    const result = await api<AuthResponse>('POST', '/register', payload)
    authenticate(result)
  }

  async function logout() {
    await api<AuthResponse>('DELETE', '/logout')
    token.value = null
    user.value = null
    localStorage.removeItem('token')
  }

  async function me() {
    const result = await api<AuthResponse>('GET', '/me') as { user: User }
    user.value = result.user
    return user.value
  }

  return { user, token, login, register, logout, me }
});
