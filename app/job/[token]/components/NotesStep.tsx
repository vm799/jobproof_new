'use client'

interface NotesStepProps {
  notes: string
  onNotesChange: (notes: string) => void
  onNext: () => void
}

export default function NotesStep({ notes, onNotesChange, onNext }: NotesStepProps) {
  return (
    <div className="mt-6 space-y-4">
      <h2 className="text-xl font-bold text-slate-900">Work Notes</h2>
      <label htmlFor="work-notes" className="sr-only">Work notes</label>
      <textarea
        id="work-notes"
        placeholder="What work was done? Any issues?"
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        className="w-full p-4 border-2 border-stone-300 rounded-md h-36 focus:border-amber-500 outline-none text-base text-stone-800 placeholder:text-stone-400"
        style={{ fontSize: '16px' }}
      />
      <button onClick={onNext} className="w-full bg-slate-900 text-white py-4 rounded-md font-bold hover:bg-slate-800 transition-colors">
        Next: Client Signature
      </button>
    </div>
  )
}
