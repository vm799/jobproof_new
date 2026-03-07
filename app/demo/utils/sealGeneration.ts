import { SEAL_LENGTH } from '@/lib/constants'
import type { JobData } from '../types'

export function generateSeal(jobData: JobData): string {
  const data = JSON.stringify({
    beforePhoto: jobData.beforePhoto?.slice(0, 50),
    afterPhoto: jobData.afterPhoto?.slice(0, 50),
    latitude: jobData.latitude,
    longitude: jobData.longitude,
    w3w: jobData.w3w,
    notes: jobData.notes,
    timestamp: jobData.timestamp
  })
  return btoa(data).slice(0, SEAL_LENGTH)
}
