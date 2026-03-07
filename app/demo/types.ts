export type Step = 'intro' | 'photo-before' | 'photo-after' | 'location' | 'notes' | 'signature' | 'review' | 'export'

export const STEPS: Step[] = ['intro', 'photo-before', 'photo-after', 'location', 'notes', 'signature', 'review', 'export']

export const STEP_LABELS: Record<Step, string> = {
  'intro': 'Start',
  'photo-before': 'Before',
  'photo-after': 'After',
  'location': 'Location',
  'notes': 'Notes',
  'signature': 'Signature',
  'review': 'Review',
  'export': 'Done',
}

export interface JobData {
  beforePhoto?: string
  afterPhoto?: string
  latitude?: number
  longitude?: number
  notes: string
  signature?: string
  timestamp: number
  w3w?: string
}
