interface IntroStepProps {
  onStart: () => void
}

export default function IntroStep({ onStart }: IntroStepProps) {
  return (
    <div className="mt-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Document Your Job</h2>
        <p className="text-stone-500 text-sm mt-1">Capture tamper-proof evidence in 7 steps. Works offline.</p>
      </div>
      <div className="space-y-2">
        {[
          { n: '1', label: 'Take a before photo' },
          { n: '2', label: 'Take an after photo' },
          { n: '3', label: 'Capture GPS location' },
          { n: '4', label: 'Add work notes' },
          { n: '5', label: 'Client signs off' },
          { n: '6', label: 'Cryptographically sealed' },
          { n: '7', label: 'Export proof file' },
        ].map((s) => (
          <div key={s.n} className="flex items-center gap-3 p-3 bg-white rounded-md shadow-sm border border-stone-100">
            <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{s.n}</span>
            <span className="text-stone-700 text-sm font-medium">{s.label}</span>
          </div>
        ))}
      </div>
      <button
        onClick={onStart}
        className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 py-4 rounded-md font-bold text-lg transition-colors"
      >
        Start Job Documentation
      </button>
      <p className="text-xs text-stone-400 text-center">Works 100% offline. No WiFi needed.</p>
    </div>
  )
}
