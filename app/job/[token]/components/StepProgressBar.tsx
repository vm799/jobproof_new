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
  onBack?: () => void
}

export default function StepProgressBar({ step, stepIndex, totalSteps, progress, onBack }: StepProgressBarProps) {
  const canGoBack = stepIndex > 1 && step !== 'submitted' // can't go back from job-details or submitted
  return (
    <div className="bg-white border-b border-stone-200 px-4 py-3">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center text-xs mb-2">
          <div className="flex items-center gap-2">
            {canGoBack && onBack && (
              <button
                onClick={onBack}
                className="text-stone-400 hover:text-stone-600 transition-colors flex items-center gap-1"
                aria-label="Go back"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                Back
              </button>
            )}
            <span className="text-stone-500 font-medium">{STEP_LABELS[step]}</span>
          </div>
          <span className="text-stone-400">{stepIndex + 1} / {totalSteps}</span>
        </div>
        <div className="w-full bg-stone-200 rounded-full h-1.5">
          <div className="bg-amber-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
      </div>
    </div>
  )
}
