import type { Step } from '../types'
import { STEPS, STEP_LABELS } from '../types'

interface StepProgressBarProps {
  step: Step
}

export default function StepProgressBar({ step }: StepProgressBarProps) {
  const stepIndex = STEPS.indexOf(step)
  const progress = ((stepIndex + 1) / STEPS.length) * 100

  return (
    <div className="bg-white border-b border-stone-200 px-4 py-3">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-stone-500 font-medium">{STEP_LABELS[step]}</span>
          <span className="text-stone-400">{stepIndex + 1} / {STEPS.length}</span>
        </div>
        <div className="w-full bg-stone-200 rounded-full h-1.5">
          <div className="bg-amber-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
      </div>
    </div>
  )
}
