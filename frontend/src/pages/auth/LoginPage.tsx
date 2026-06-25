import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Pill, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'

interface LoginForm {
  email: string
  password: string
}

export default function LoginPage() {
  const [form, setForm] = useState<LoginForm>({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const res = await api.post('/auth/login', data)
      return res.data
    },
    onSuccess: (data) => {
      login(data.user, data.accessToken)
      toast.success(`¡Bienvenido, ${data.user.name}!`)
      navigate('/dashboard')
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message ?? 'Credenciales incorrectas'
      toast.error(typeof msg === 'string' ? msg : 'Error al iniciar sesión')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      toast.error('Por favor completa todos los campos')
      return
    }
    loginMutation.mutate(form)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <Pill size={32} color="white" />
          </div>
          <h1>FarmaciaPOS</h1>
          <p>Sistema de Administración de Farmacia</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Correo electrónico</label>
            <div className="form-input-group">
              <Mail size={16} className="form-input-icon" />
              <input
                id="login-email"
                type="email"
                className="input"
                placeholder="usuario@farmacia.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                autoComplete="email"
                disabled={loginMutation.isPending}
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Contraseña</label>
            <div className="form-input-group" style={{ position: 'relative' }}>
              <Lock size={16} className="form-input-icon" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                autoComplete="current-password"
                disabled={loginMutation.isPending}
                style={{ paddingLeft: 36, paddingRight: 42 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center',
                }}
                id="toggle-password"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full"
            id="btn-login"
            disabled={loginMutation.isPending}
            style={{ marginTop: 8 }}
          >
            {loginMutation.isPending ? (
              <>
                <span className="animate-pulse">●</span>
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '12px', color: 'var(--text-muted)' }}>
          FarmaciaPOS v1.0 · Bolivia
        </p>
      </div>
    </div>
  )
}
