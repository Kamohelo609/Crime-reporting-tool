import { ShieldIcon, CheckIcon } from './Icons.jsx'

const tips = [
  { id: 1, text: 'Submit reports anonymously — your identity stays protected.' },
  { id: 2, text: 'Attach photos or video to give officers crucial evidence.' },
  { id: 3, text: 'Track your report in real time using your anonymous token.' },
  { id: 4, text: 'Never approach suspects. Report, then stay safe.' }
]

const hotlines = [
  { label: 'Emergency', value: '112' },
  { label: 'Police', value: '10111' },
  { label: 'Ambulance', value: '10177' },
  { label: 'SAPS Crime Stop', value: '08600 10111' }
]

export default function AuthShell({ children }) {
  return (
    <div className="auth-grid">
      <aside className="auth-brand-panel">
        <div>
          <div className="brand" style={{ marginBottom: 26 }}>
            <span className="brand-badge">
              <ShieldIcon size={20} />
            </span>
            <span>
              Safety<em>Connect</em>
            </span>
          </div>
          <h3>
            Community Safety, <span>Powered</span> Together
          </h3>
        </div>

        <div className="auth-tips">
          {tips.map((t) => (
            <div className="auth-tip" key={t.id}>
              <span className="tick">
                <CheckIcon size={13} />
              </span>
              <span>{t.text}</span>
            </div>
          ))}
        </div>

        <div className="auth-hotlines">
          <h4>Emergency Hotlines</h4>
          {hotlines.map((h) => (
            <div className="hotline" key={h.label}>
              <span>{h.label}</span>
              <b>{h.value}</b>
            </div>
          ))}
        </div>
      </aside>

      <div className="card auth-card">{children}</div>
    </div>
  )
}