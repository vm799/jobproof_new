import { CheckIcon } from '@heroicons/react/20/solid'
import Link from 'next/link'

interface ExportStepProps {
  isOnline: boolean
  emailAddress: string
  emailSent: boolean
  emailError: string
  sendingEmail: boolean
  pendingEmails: number
  onEmailChange: (email: string) => void
  onSendReport: () => void
  onExportAgain: () => void
  onStartNewJob: () => void
}

export default function ExportStep({
  isOnline,
  emailAddress,
  emailSent,
  emailError,
  sendingEmail,
  pendingEmails,
  onEmailChange,
  onSendReport,
  onExportAgain,
  onStartNewJob,
}: ExportStepProps) {
  return (
    <div className="mt-6 space-y-5">
      <h2 className="text-xl font-bold text-slate-900">Report Ready</h2>

      <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-md text-center">
        <p className="text-emerald-900 font-bold text-lg">Report saved to your device</p>
        <p className="text-emerald-700 text-sm mt-1">Open the HTML file in any browser to view or print.</p>
      </div>

      <div className="bg-white border border-stone-200 rounded-md p-5 shadow-sm space-y-3">
        <h3 className="font-bold text-slate-900 text-sm">Email Report</h3>
        <p className="text-xs text-stone-500">Send to your client, attorney, or insurer.</p>

        {emailSent ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3 text-center">
            <p className="text-emerald-800 font-medium text-sm">
              {isOnline ? `Report sent to ${emailAddress}` : `Queued for ${emailAddress} — will send when online`}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <input
              type="email"
              placeholder="email@example.com"
              value={emailAddress}
              onChange={(e) => onEmailChange(e.target.value)}
              className="w-full p-3 border-2 border-stone-300 rounded-md focus:border-amber-500 outline-none text-sm"
            />
            {emailError && <p className="text-red-600 text-xs">{emailError}</p>}
            <button
              onClick={onSendReport}
              disabled={sendingEmail}
              className="w-full bg-slate-900 text-white py-3 rounded-md font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {sendingEmail ? 'Sending...' : isOnline ? 'Send Report' : 'Queue for Sending'}
            </button>
          </div>
        )}

        {pendingEmails > 0 && (
          <p className="text-amber-700 text-xs font-medium">{pendingEmails} report{pendingEmails > 1 ? 's' : ''} queued — will send when online</p>
        )}
      </div>

      <button
        onClick={onExportAgain}
        className="w-full border-2 border-stone-300 py-3 rounded-md font-medium text-stone-600 hover:border-stone-400 transition-colors text-sm"
      >
        Download Again
      </button>

      <div className="bg-stone-100 p-5 rounded-md space-y-2">
        <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide">Your report includes</h3>
        <ul className="text-xs text-stone-600 space-y-1">
          <li className="flex items-center gap-2"><CheckIcon className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> Before &amp; after photo evidence</li>
          <li className="flex items-center gap-2"><CheckIcon className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> GPS location, what3words &amp; timestamp</li>
          <li className="flex items-center gap-2"><CheckIcon className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> Client digital signature</li>
          <li className="flex items-center gap-2"><CheckIcon className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> Client satisfaction sign-off</li>
          <li className="flex items-center gap-2"><CheckIcon className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> Cryptographic tamper-proof seal</li>
        </ul>
      </div>

      <div className="space-y-3">
        <button
          onClick={onStartNewJob}
          className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 py-4 rounded-md font-bold transition-colors"
        >
          Start New Job
        </button>
        <Link
          href="/#email-form"
          className="w-full border-2 border-slate-900 text-slate-900 py-3 rounded-md font-medium hover:bg-slate-50 text-center block transition-colors text-sm"
        >
          Get Full Version ($29/month)
        </Link>
      </div>
    </div>
  )
}
