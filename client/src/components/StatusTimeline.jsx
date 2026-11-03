import { STATUS_FLOW } from '../services/api.js'
import { CheckIcon } from './Icons.jsx'

export default function StatusTimeline({ status }) {
  const currentIdx = Math.max(0, STATUS_FLOW.indexOf(status))
  const doneCount = currentIdx

  return (
    <div>
      <div className={`timeline step-done`}>
        {STATUS_FLOW.map((step, i) => {
          const done = i <= doneCount
          const live = i === doneCount && doneCount < STATUS_FLOW.length - 1
          return (
            <div key={step} className={`step${done ? ' done' : ''}${live ? ' live' : ''}`}>
              <span className="ball">{done ? <CheckIcon size={18} /> : live ? '●' : i + 1}</span>
              <b>{step}</b>
              {i === doneCount && <span>Current stage</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}