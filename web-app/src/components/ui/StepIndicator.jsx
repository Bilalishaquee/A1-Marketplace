import { Check } from 'lucide-react'
import clsx from 'clsx'

export default function StepIndicator({ steps, currentStep }) {
  return (
    <div className="flex items-center justify-center gap-0">
      {steps.map((step, i) => {
        const done    = i < currentStep
        const active  = i === currentStep
        const last    = i === steps.length - 1
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={clsx(
                'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300',
                done   && 'bg-turquoise-500 border-turquoise-500 text-white',
                active && 'bg-white border-turquoise-500 text-turquoise-600',
                !done && !active && 'bg-white border-slate-200 text-slate-400',
              )}>
                {done ? <Check size={16} /> : i + 1}
              </div>
              <span className={clsx(
                'mt-1.5 text-xs font-medium whitespace-nowrap',
                active ? 'text-turquoise-600' : done ? 'text-turquoise-500' : 'text-slate-400',
              )}>
                {step}
              </span>
            </div>
            {!last && (
              <div className={clsx(
                'w-16 md:w-24 h-0.5 mx-2 mb-4 transition-all duration-300',
                done ? 'bg-turquoise-500' : 'bg-slate-200',
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}
