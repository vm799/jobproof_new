'use client'

type Step = 'job-details' | 'photo-before' | 'photo-after' | 'location' | 'notes' | 'signature' | 'review' | 'submitted'

const STEP_LABELS: Record<Step, string> = {
  'job-details': 'Job Details',
  'photo-before': 'Before',
  'photo-after': 'After',
  'location': 'Location',
  'notes': 'Notes',
  'signature': 'Signature',
  'review': 'Review',
  'submitted': 'Done',
}

interface StepProgressBarProps {
  step: Step
  stepIndex: number
  totalSteps: number
  progress: number
}

export default function StepProgressBar({ step, stepIndex, totalSteps, progress }: StepProgressBarProps) {
  return (
    <div className="bg-white border-b border-stone-200 px-4 py-3">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-stone-500 font-medium">{STEP_LABELS[step]}</span>
          <span className="text-stone-400">{stepIndex + 1} / {totalSteps}</span>
        </div>
        <div className="w-full bg-stone-200 rounded-full h-1.5">
          <div className="bg-amber-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
      </div>
    </div>
  )
}
