import { CheckIcon } from '@heroicons/react/20/solid'

interface SatisfactionStepProps {
  clientSatisfied: boolean
  clientFeedback: string
  onSatisfiedChange: (satisfied: boolean) => void
  onFeedbackChange: (feedback: string) => void
  onNext: () => void
}

export default function SatisfactionStep({
  clientSatisfied,
  clientFeedback,
  onSatisfiedChange,
  onFeedbackChange,
  onNext,
}: SatisfactionStepProps) {
  return (
    <div className="mt-6 space-y-4">
      <h2 className="text-xl font-bold text-slate-900">Client Sign-Off</h2>
      <p className="text-stone-500 text-sm">Ask the client to confirm they are happy with the completed work.</p>

      <button
        onClick={() => onSatisfiedChange(!clientSatisfied)}
        className={`w-full flex items-center gap-3 p-4 rounded-md border-2 transition-colors text-left ${
          clientSatisfied
            ? 'border-emerald-500 bg-emerald-50'
            : 'border-stone-300 bg-white hover:border-stone-400'
        }`}
      >
        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 ${
          clientSatisfied ? 'bg-emerald-500 border-emerald-500' : 'border-stone-400'
        }`}>
          {clientSatisfied && <CheckIcon className="w-4 h-4 text-white" />}
        </div>
        <span className={`text-sm font-medium ${clientSatisfied ? 'text-emerald-900' : 'text-slate-700'}`}>
          I confirm the work has been completed to my satisfaction
        </span>
      </button>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Additional notes <span className="text-stone-400 font-normal">(optional)</span>
        </label>
        <textarea
          rows={3}
          placeholder="Any comments about the work..."
          value={clientFeedback}
          onChange={(e) => onFeedbackChange(e.target.value)}
          className="w-full p-3 border-2 border-stone-300 rounded-md focus:border-amber-500 outline-none text-sm resize-none"
        />
      </div>

      <button
        onClick={onNext}
        disabled={!clientSatisfied}
        className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 py-4 rounded-md font-bold text-lg transition-colors"
      >
        Continue to Review
      </button>

      {!clientSatisfied && (
        <p className="text-stone-400 text-xs text-center">Client must tick the box above to proceed</p>
      )}
    </div>
  )
}
