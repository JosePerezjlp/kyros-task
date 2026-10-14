import { useState, type FormEvent } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotify } from '../context/NotificationContext'
import { getErrorMessage } from '../services/api'
import * as authService from '../services/auth.service'

interface Props {
  mode: 'login' | 'register'
}

// Shared layout for the Login and Register pages
export default function AuthForm({ mode }: Props) {
  const isLogin = mode === 'login'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login } = useAuth()
  const notify = useNotify()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const auth = isLogin ? await authService.login(email, password) : await authService.register(email, password)
      login(auth)
      notify('success', isLogin ? `Bienvenido, ${auth.user.email}` : 'Cuenta creada correctamente')
      navigate('/tasks')
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined
      if (status === 401) notify('error', 'Email o contraseña incorrectos')
      else if (status === 409) notify('error', 'Ese email ya está registrado')
      else notify('error', getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-2xl font-bold text-indigo-600">Gestor de Tareas</h1>
        <p className="mb-6 text-center text-sm text-slate-500">{isLogin ? 'Inicia sesión para continuar' : 'Crea tu cuenta'}</p>
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="input"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              className="input"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              minLength={isLogin ? undefined : 8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {!isLogin && <p className="mt-1 text-xs text-slate-500">Mínimo 8 caracteres.</p>}
          </div>
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? 'Procesando…' : isLogin ? 'Iniciar sesión' : 'Registrarme'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
          <Link to={isLogin ? '/register' : '/login'} className="font-medium text-indigo-600 hover:underline">
            {isLogin ? 'Regístrate' : 'Inicia sesión'}
          </Link>
        </p>
      </div>
    </div>
  )
}
