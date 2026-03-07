'use client'

interface JobInfo {
  id: string
  title: string
  address: string | null
  instructions: string | null
  crew_name: string | null
  status: string
}

interface JobDetailsStepProps {
  jobInfo: JobInfo
  accepting: boolean
  onAccept: () => void
}

export default function JobDetailsStep({ jobInfo, accepting, onAccept }: JobDetailsStepProps) {
  return (
    <div className="mt-6 space-y-4">
      <div className="bg-white rounded-md shadow-sm border border-stone-100 p-5">
        <p className="text-xs text-amber-600 font-bold uppercase tracking-wide mb-2">New Job Assigned</p>
        <h2 className="text-xl font-bold text-slate-900">{jobInfo.title}</h2>
        {jobInfo.address && <p className="text-stone-500 text-sm mt-1">{jobInfo.address}</p>}
        {jobInfo.instructions && (
          <div className="mt-3 bg-stone-50 border border-stone-200 rounded-md p-3">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-1">Instructions</p>
            <p className="text-stone-700 text-sm whitespace-pre-wrap">{jobInfo.instructions}</p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {[
          { n: '1', label: 'Take a before photo' },
          { n: '2', label: 'Take an after photo' },
          { n: '3', label: 'Capture GPS location' },
          { n: '4', label: 'Add work notes' },
          { n: '5', label: 'Client signs off' },
          { n: '6', label: 'Review & submit' },
        ].map((s) => (
          <div key={s.n} className="flex items-center gap-3 p-3 bg-white rounded-md shadow-sm border border-stone-100">
            <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{s.n}</span>
            <span className="text-stone-700 text-sm font-medium">{s.label}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onAccept}
        disabled={accepting}
        className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 py-4 rounded-md font-bold text-lg transition-colors disabled:opacity-50"
      >
        {accepting ? 'Accepting...' : 'Accept Job & Start'}
      </button>
    </div>
  )
}
