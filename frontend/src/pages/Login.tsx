import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

const Login = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const login = useAuthStore((state) => state.login)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await api.post('/auth/login', data)
      const { access_token, user_id, username } = response.data

      login(access_token, {
        id: user_id,
        username,
        email: `${username}@cronix.com`,
        role: 'trader'
      })
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Cronix Trading Terminal
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Sign in to your account
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive-foreground px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                {...register('username')}
                type="text"
                placeholder="Username"
                className="relative block w-full px-3 py-2 border border-border bg-background text-foreground placeholder-muted-foreground rounded-t-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
              {errors.username && (
                <p className="text-destructive text-sm mt-1">{errors.username.message}</p>
              )}
            </div>
            <div>
              <input
                {...register('password')}
                type="password"
                placeholder="Password"
                className="relative block w-full px-3 py-2 border border-border bg-background text-foreground placeholder-muted-foreground rounded-b-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
              {errors.password && (
                <p className="text-destructive text-sm mt-1">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Demo credentials: <strong>demo / demo</strong>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login