const DB_NAME = 'jobproof'
const DB_VERSION = 1

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('jobs')) {
        db.createObjectStore('jobs', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('outbox')) {
        db.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function tx(storeName: string, mode: IDBTransactionMode): Promise<{ store: IDBObjectStore; done: Promise<void> }> {
  return openDB().then(db => {
    const transaction = db.transaction(storeName, mode)
    const store = transaction.objectStore(storeName)
    const done = new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
    return { store, done }
  })
}

export interface PersistedJob {
  id: string
  step: string
  beforePhoto?: string
  afterPhoto?: string
  latitude?: number
  longitude?: number
  notes: string
  signature?: string
  timestamp: number
  w3w?: string
}

export interface OutboxEntry {
  id?: number
  email: string
  html: string
  jobId: string
  createdAt: number
}

export async function saveJob(job: PersistedJob): Promise<void> {
  const { store, done } = await tx('jobs', 'readwrite')
  store.put(job)
  await done
}

export async function loadJob(id: string): Promise<PersistedJob | null> {
  const { store } = await tx('jobs', 'readonly')
  return new Promise((resolve, reject) => {
    const req = store.get(id)
    req.onsuccess = () => resolve(req.result ?? null)
    req.onerror = () => reject(req.error)
  })
}

export async function loadLatestJob(): Promise<PersistedJob | null> {
  const { store } = await tx('jobs', 'readonly')
  return new Promise((resolve, reject) => {
    const req = store.getAll()
    req.onsuccess = () => {
      const jobs = req.result as PersistedJob[]
      if (jobs.length === 0) return resolve(null)
      jobs.sort((a, b) => b.timestamp - a.timestamp)
      resolve(jobs[0])
    }
    req.onerror = () => reject(req.error)
  })
}

export async function deleteJob(id: string): Promise<void> {
  const { store, done } = await tx('jobs', 'readwrite')
  store.delete(id)
  await done
}

export async function addToOutbox(entry: Omit<OutboxEntry, 'id'>): Promise<void> {
  const { store, done } = await tx('outbox', 'readwrite')
  store.add(entry)
  await done
}

export async function getOutboxPending(): Promise<OutboxEntry[]> {
  const { store } = await tx('outbox', 'readonly')
  return new Promise((resolve, reject) => {
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function removeFromOutbox(id: number): Promise<void> {
  const { store, done } = await tx('outbox', 'readwrite')
  store.delete(id)
  await done
}
