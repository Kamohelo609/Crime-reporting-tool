import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthShell from '../components/AuthShell.jsx'
import { useToasts } from '../components/Toasts.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { registerUser } from '../services/api.js'
import { ShieldIcon } from '../components/Icons.jsx'

export default function Register() {
  const { login } = useAuth()
  const { toast, render } = useToasts()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', password: '' })
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.fullName || !form.phone || !form.email || form.password.length < 6) {
      toast.error('Please fill in all fields (password ≥ 6 characters)')
      return
    }
    setBusy(true)
    try {
      const res = await registerUser(form)
      login(res)
      toast.success(`Welcome, ${res.user.fullName || res.user.name}!`)
      navigate('/')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Registration failed — please try again')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page container">
      <div className="section-head" style={{ marginTop: 28 }}>
        <div>
          <h2>Citizen Registration</h2>
          <p>Create an account to manage reports and receive faster follow-ups.</p>
        </div>
      </div>

      <AuthShell>
        <div className="auth-tabs">
          <button className="auth-tab active">Register Account</button>
          <Link className="auth-tab" to="/login" style={{ display: 'grid', placeItems: 'center' }}>
            Login
          </Link>
        </div>

        <form onSubmit={submit} className="auth-form">
          <div className="field">
            <label className="label">Full Name</label>
            <input className="input" placeholder="e.g. Thabo Nkosi" value={form.fullName} onChange={set('fullName')} />
          </div>
          <div className="field">
            <label className="label">Phone Number</label>
            <input className="input" placeholder="e.g. +27 82 123 4567" value={form.phone} onChange={set('phone')} />
          </div>
          <div className="field">
            <label className="label">Email Address</label>
            <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} />
          </div>
          <div className="field">
            <label className="label">Password</label>
            <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} />
          </div>
          <button className="btn btn-blue btn-lg btn-block" disabled={busy}>
            {busy ? 'Creating account…' : (
              <>
                <ShieldIcon size={17} /> Create Account
              </>
            )}
          </button>
        </form>

        <div className="auth-alt">
          Need to report immediately?{' '}
          <Link to="/report">
            <b>Continue as Guest</b>
          </Link>
        </div>
      </AuthShell>

      {render()}
    </div>
  )
}