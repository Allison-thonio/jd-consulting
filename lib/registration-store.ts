import { logRegistrationToDb, getRegistrationByEmailFromDb } from './mongodb'

export interface FullRegistrationData {
  fullName: string
  phone: string
  email: string
  age: number
  location: string
  education: 'SSCE' | 'Graduate'
  position: string
  experience: string
  documentFilename: string
  documentBuffer: Buffer
  submittedAt: Date
  ip: string
}

declare global {
  // eslint-disable-next-line no-var
  var _pendingRegistrationStore: Map<string, FullRegistrationData> | undefined
}

if (!global._pendingRegistrationStore) {
  global._pendingRegistrationStore = new Map<string, FullRegistrationData>()
}

const memoryStore = global._pendingRegistrationStore

export async function savePendingRegistration(data: FullRegistrationData): Promise<void> {
  const key = data.email.toLowerCase().trim()
  memoryStore.set(key, data)

  // Best-effort write to MongoDB
  await logRegistrationToDb({
    fullName: data.fullName,
    phone: data.phone,
    email: data.email,
    age: data.age,
    location: data.location,
    education: data.education,
    position: data.position,
    experience: data.experience,
    documentFilename: data.documentFilename,
    documentSizeBytes: data.documentBuffer.length,
    documentBase64: data.documentBuffer.toString('base64'),
    submittedAt: data.submittedAt,
    ip: data.ip,
    status: 'pending_test',
  })
}

export async function getRegistrationByEmail(email: string, clientIp?: string): Promise<FullRegistrationData | null> {
  const key = email.toLowerCase().trim()

  if (memoryStore.has(key)) {
    return memoryStore.get(key)!
  }

  // Fallback: fetch from MongoDB if available
  const dbDoc = await getRegistrationByEmailFromDb(key)
  if (dbDoc) {
    let docBuf = Buffer.alloc(0)
    if (dbDoc.documentBase64) {
      try {
        docBuf = Buffer.from(dbDoc.documentBase64, 'base64')
      } catch (e) {
        console.error('[RegistrationStore] Failed to decode base64 document:', e)
      }
    }
    return {
      fullName: dbDoc.fullName,
      phone: dbDoc.phone,
      email: dbDoc.email,
      age: dbDoc.age,
      location: dbDoc.location,
      education: dbDoc.education,
      position: dbDoc.position,
      experience: dbDoc.experience,
      documentFilename: dbDoc.documentFilename,
      documentBuffer: docBuf,
      submittedAt: dbDoc.submittedAt ? new Date(dbDoc.submittedAt) : new Date(),
      ip: dbDoc.ip || clientIp || '0.0.0.0',
    }
  }

  return null
}
