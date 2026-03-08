'use client'

import { MapPinIcon } from '@heroicons/react/20/solid'

interface LocationStepProps {
  beforePhoto?: string
  afterPhoto?: string
  latitude?: number
  longitude?: number
  w3w?: string
  gettingLocation?: boolean
  onGetLocation: () => void
  onContinue: () => void
}

export default function LocationStep({
  beforePhoto,
  afterPhoto,
  latitude,
  longitude,
  w3w,
  gettingLocation,
  onGetLocation,
  onContinue,
}: LocationStepProps) {
  return (
    <div className="mt-6 space-y-4">
      <h2 className="text-xl font-bold text-slate-900">GPS Location</h2>
      {beforePhoto && afterPhoto && (
        <div className="grid grid-cols-2 gap-2">
          <div className="relative rounded-md overflow-hidden">
            <img src={beforePhoto} alt="Before" className="w-full h-24 object-cover" />
            <span className="absolute bottom-1 left-1 bg-slate-900/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">Before</span>
          </div>
          <div className="relative rounded-md overflow-hidden">
            <img src={afterPhoto} alt="After" className="w-full h-24 object-cover" />
            <span className="absolute bottom-1 left-1 bg-slate-900/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">After</span>
          </div>
        </div>
      )}
      <button onClick={onGetLocation} disabled={gettingLocation} className="w-full bg-slate-900 text-white py-4 rounded-md font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-colors disabled:opacity-50">
        {gettingLocation ? (
          <>
            <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></div>
            Getting Location...
          </>
        ) : (
          <>
            <MapPinIcon className="w-5 h-5" /> Get My GPS Location
          </>
        )}
      </button>
      {latitude && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <p className="text-emerald-700 text-xs font-bold uppercase tracking-wide">Location captured</p>
          </div>
          <p className="text-amber-900 font-mono text-sm">{latitude.toFixed(6)}, {longitude?.toFixed(6)}</p>
          {w3w && <p className="text-amber-800 font-mono text-sm mt-1">{'///\u2009'}{w3w}</p>}
        </div>
      )}
      <button onClick={onContinue} className="w-full border-2 border-stone-300 py-3 rounded-md font-medium text-stone-600 hover:border-stone-400 transition-colors">
        {latitude ? 'Continue' : 'Skip Location'}
      </button>
    </div>
  )
}
