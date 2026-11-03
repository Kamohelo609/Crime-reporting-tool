import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthShell from '../components/AuthShell.jsx'
import { useToasts } from '../components/Toasts.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { loginUser } from '../services/api.js'
import { ShieldIcon, UserIcon, SirenIcon } from '../components/Icons.jsx'

export default function Login() {
  const { login } = useAuth()
  const { toast, render } = useToasts()
  const navigate = useNavigate()
  const [role, setRole] = useState('citizen')
  const [form, setForm] = useState({ email: '', password: '' })
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) return toast.error('Enter your account and password')
    setBusy(true)
    try {
      const res = await loginUser({ email: form.email, password: form.password, role })
      login(res)
      if (res.user.role === 'officer') {
        toast.success(`Welcome back, Officer ${res.user.fullName} (${res.user.badge})`)
        navigate('/dashboard')
      } else {
        toast.success('Signed in successfully')
        navigate('/')
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Invalid credentials')
    } finally {
      setBusy(false)
    }
  }

  const isOfficer = role === 'officer'

  return (
    <div className="page container">
      <div className="section-head" style={{ marginTop: 28 }}>
        <div>
          <h2>Sign in to SafetyConnect</h2>
          <p>All-access login for citizens and police dispatch officers.</p>
        </div>
      </div>

      <AuthShell>
        <div className="auth-tabs">
          <Link className="auth-tab" to="/register" style={{ display: 'grid', placeItems: 'center' }}>
            Register Account
          </Link>
          <span className="auth-tab active" style={{ display: 'grid', placeItems: 'center' }}>
            Login
          </span>
        </div>

        <div className="role-toggle">
          <button
            type="button"
            className={`role-btn${!isOfficer ? ' active' : ''}`}
            onClick={() => setRole('citizen')}
          >
            <UserIcon size={15} /> Citizen
          </button>
          <button
            type="button"
            className={`role-btn officer${isOfficer ? ' active' : ''}`}
            onClick={() => setRole('officer')}
          >
            <SirenIcon size={15} /> Police Officer
          </button>
        </div>

        <form onSubmit={submit} className="auth-form">
          <div className="field">
            <label className="label">
              {isOfficer ? 'Officer Badge / Email Address' : 'Email Address'}
            </label>
            <input
              className="input"
              type={isOfficer ? 'text' : 'email'}
              placeholder={isOfficer ? 'e.g. #4021 or j.doe@precinct12.gov' : 'you@example.com'}
              value={form.email}
              onChange={set('email')}
            />
          </div>
          <div className="field">
            <label className="label">Password</label>
            <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} />
          </div>

          <button className={`btn btn-lg btn-block role-submit ${isOfficer ? 'btn-primary' : 'btn-blue'}`} disabled={busy}>
            {busy ? 'Signing in…' : (
              <>
                {isOfficer ? <SirenIcon size={17} /> : <ShieldIcon size={17} />}
                {isOfficer ? 'Sign in as Officer' : 'Sign in as Citizen'}
              </>
            )}
          </button>
        </form>

        <div className="auth-alt">
          New here?{' '}
          <Link to="/register">
            <b>Create an account</b>
          </Link>
          {' · Physically report now? '}
          <Link to="/report">
            <b>Continue as Guest</b>
          </Link>
        </div>
      </AuthShell>

      {render()}
    </div>
  )
}