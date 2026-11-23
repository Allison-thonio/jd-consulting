import fs from 'fs'
import path from 'path'
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

// On Vercel (and other read-only filesystems), use /tmp which is always writable.
// Falls back to .cache/ in the project root for local development.
const CACHE_DIR = process.env.VERCEL
  ? path.join('/tmp', 'jd-registrations')
  : path.join(process.cwd(), '.cache', 'registrations')

function ensureCacheDir() {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true })
    }
  } catch (err) {
    console.error('[RegistrationStore] Failed to create cache directory:', err)
  }
}

function getCacheFilePath(key: string): string {
  const safeName = Buffer.from(key).toString('hex')
  return path.join(CACHE_DIR, `${safeName}.json`)
}

function saveToDisk(key: string, data: FullRegistrationData) {
  try {
    ensureCacheDir()
    const filePath = getCacheFilePath(key)
    const payload = {
      fullName: data.fullName,
      phone: data.phone,
      email: data.email,
      age: data.age,
      location: data.location,
      education: data.education,
      position: data.position,
      experience: data.experience,
      documentFilename: data.documentFilename,
      documentBase64: data.documentBuffer.toString('base64'),
      submittedAt: data.submittedAt.toISOString(),
      ip: data.ip,
    }
    fs.writeFileSync(filePath, JSON.stringify(payload), 'utf8')
    console.log(`[RegistrationStore] ✅ Saved to disk: ${data.email} | file: ${data.documentFilename} | size: ${data.documentBuffer.length} bytes | path: ${filePath}`)
  } catch (err) {
    console.error('[RegistrationStore] ❌ Failed to cache registration to disk:', err)
  }
}

function getFromDisk(key: string): FullRegistrationData | null {
  try {
    const filePath = getCacheFilePath(key)
    if (!fs.existsSync(filePath)) {
      console.warn(`[RegistrationStore] ⚠️ No disk cache found for: ${key} at ${filePath}`)
      return null
    }
    const raw = fs.readFileSync(filePath, 'utf8')
    const parsed = JSON.parse(raw)
    const docBuf = Buffer.from(parsed.documentBase64 || '', 'base64')
    console.log(`[RegistrationStore] ✅ Loaded from disk: ${key} | file: ${parsed.documentFilename} | size: ${docBuf.length} bytes`)
    return {
      fullName: parsed.fullName,
      phone: parsed.phone,
      email: parsed.email,
      age: parsed.age,
      location: parsed.location,
      education: parsed.education,
      position: parsed.position,
      experience: parsed.experience,
      documentFilename: parsed.documentFilename,
      documentBuffer: docBuf,
      submittedAt: new Date(parsed.submittedAt),
      ip: parsed.ip,
    }
  } catch (err) {
    console.error('[RegistrationStore] ❌ Failed to read cached registration from disk:', err)
    return null
  }
}

export async function savePendingRegistration(data: FullRegistrationData): Promise<void> {
  const key = data.email.toLowerCase().trim()
  console.log(`[RegistrationStore] 💾 Saving registration: ${key} | file: ${data.documentFilename} | size: ${data.documentBuffer.length} bytes`)
  memoryStore.set(key, data)
  saveToDisk(key, data)

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
  console.log(`[RegistrationStore] 🔍 Looking up registration for: ${key}`)

  if (memoryStore.has(key)) {
    const memData = memoryStore.get(key)!
    if (memData.documentBuffer && memData.documentBuffer.length > 0) {
      console.log(`[RegistrationStore] ✅ Found in memory: ${key} | file: ${memData.documentFilename} | size: ${memData.documentBuffer.length} bytes`)
      return memData
    }
    console.warn(`[RegistrationStore] ⚠️ Memory entry exists but document buffer is empty for: ${key}`)
  } else {
    console.warn(`[RegistrationStore] ⚠️ Not found in memory for: ${key}`)
  }

  // Fallback 1: local disk cache
  const diskData = getFromDisk(key)
  if (diskData && diskData.documentBuffer && diskData.documentBuffer.length > 0) {
    memoryStore.set(key, diskData)
    return diskData
  }

  // Fallback 2: fetch from MongoDB if available
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
    const retrieved: FullRegistrationData = {
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
    memoryStore.set(key, retrieved)
    return retrieved
  }

  return diskData || null
}
