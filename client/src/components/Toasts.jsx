import { useState } from 'react'
import { CheckIcon, AlertIcon, ShieldIcon } from './Icons.jsx'

const icons = {
  green: <CheckIcon size={17} />,
  red: <AlertIcon size={17} />,
  blue: <ShieldIcon size={17} />
}

export function useToasts() {
  const [toasts, setToasts] = useState([])

  const push = (message, tone = 'blue', ms = 4200) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ms)
  }

  const toast = {
    success: (m) => push(m, 'green'),
    error: (m) => push(m, 'red'),
    info: (m) => push(m, 'blue')
  }

  const render = () => (
    <div className="toast-wrap">
      {toasts.map((t) => (
        <div className={`toast ${t.tone}`} key={t.id}>
          <span style={{ display: 'grid', placeItems: 'center', color: `var(--${t.tone === 'red' ? 'red-bright' : t.tone === 'green' ? 'green-bright' : 'blue-bright'})` }}>
            {icons[t.tone]}
          </span>
          {t.message}
        </div>
      ))}
    </div>
  )

  return { toast, render }
}