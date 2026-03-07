import { MapPinIcon, CheckIcon } from '@heroicons/react/20/solid'
import type { JobData } from '../types'

interface ReviewStepProps {
  jobData: JobData
  seal: string
  onExport: () => void
}

export default function ReviewStep({ jobData, seal, onExport }: ReviewStepProps) {
  return (
    <div className="mt-6 space-y-4">
      <h2 className="text-xl font-bold text-slate-900">Review &amp; Export</h2>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="relative rounded-md overflow-hidden shadow-sm">
            {jobData.beforePhoto && <img src={jobData.beforePhoto} alt="Before" className="w-full h-40 object-cover" />}
            <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">Before</span>
          </div>
          <div className="relative rounded-md overflow-hidden shadow-sm">
            {jobData.afterPhoto && <img src={jobData.afterPhoto} alt="After" className="w-full h-40 object-cover" />}
            <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">After</span>
          </div>
        </div>

        {jobData.latitude && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-md flex items-center gap-2">
            <MapPinIcon className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-amber-900 font-mono text-xs">{jobData.latitude.toFixed(6)}, {jobData.longitude?.toFixed(6)}</p>
              {jobData.w3w && <p className="text-amber-800 font-mono text-xs mt-0.5">{'///'} {jobData.w3w}</p>}
            </div>
          </div>
        )}

        {jobData.notes && (
          <div className="bg-white border border-stone-200 p-3 rounded-md shadow-sm">
            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wide mb-1">Notes</p>
            <p className="text-stone-700 text-sm">{jobData.notes}</p>
          </div>
        )}

        {jobData.signature && (
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-md flex items-center gap-2">
            <CheckIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <p className="text-emerald-800 text-xs font-medium">Client signature captured</p>
          </div>
        )}

        {jobData.clientSatisfied && (
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-md">
            <div className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <p className="text-emerald-800 text-xs font-medium">Client confirmed work completed to satisfaction</p>
            </div>
            {jobData.clientFeedback && (
              <p className="text-emerald-700 text-xs mt-1 ml-6">{jobData.clientFeedback}</p>
            )}
          </div>
        )}

        <div className="bg-slate-900 p-3 rounded-md">
          <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wide mb-1">Cryptographic Seal</p>
          <p className="text-indigo-300 font-mono text-xs break-all">{seal}</p>
          <p className="text-stone-500 text-[10px] mt-1">Tamper-proof integrity verification</p>
        </div>
      </div>

      <button
        onClick={onExport}
        className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 py-4 rounded-md font-bold text-lg flex items-center justify-center gap-2 transition-colors"
      >
        <CheckIcon className="w-5 h-5" />
        Download Report
      </button>
    </div>
  )
}
