import { MongoClient, Db } from 'mongodb'

const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB_NAME || 'jd_outsourcing'

let client: MongoClient | null = null
let clientPromise: Promise<MongoClient> | null = null

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

if (uri) {
  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so the MongoClient is not repeated on hot reload
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri)
      global._mongoClientPromise = client.connect()
    }
    clientPromise = global._mongoClientPromise
  } else {
    // In production mode, avoid global variable
    client = new MongoClient(uri)
    clientPromise = client.connect()
  }
}

/**
 * Returns the MongoDB Database instance if MONGODB_URI is provided, or null if unset.
 */
async function getDb(): Promise<Db | null> {
  if (!uri || !clientPromise) {
    return null
  }
  try {
    const connectedClient = await clientPromise
    return connectedClient.db(dbName)
  } catch (err) {
    console.error('[MongoDB] Connection error:', err)
    return null
  }
}

export interface RegistrationDocument {
  fullName: string
  phone: string
  email: string
  age: number
  location: string
  education: 'SSCE' | 'Graduate'
  position: string
  experience: string
  documentFilename: string
  documentSizeBytes: number
  submittedAt: Date
  ip: string
}

export interface TestResultDocument {
  fullName: string
  email: string
  position: string
  level: 'SSCE' | 'Graduate'
  correct: number
  total: number
  percentage: number
  breakdown: Array<{
    prompt: string
    candidateAnswer: string
    correctAnswer: string
    isCorrect: boolean
  }>
  submittedAt: Date
  ip: string
}

/**
 * Best-effort write to the 'registrations' collection.
 * Catches all errors internally so database failures NEVER block or fail the candidate registration.
 */
export async function logRegistrationToDb(doc: RegistrationDocument): Promise<void> {
  try {
    const db = await getDb()
    if (!db) return // MongoDB not configured, gracefully no-op

    await db.collection('registrations').insertOne(doc)
  } catch (err) {
    console.error('[MongoDB] Failed to log candidate registration document:', err)
  }
}

/**
 * Best-effort write to the 'testResults' collection.
 * Catches all errors internally so database failures NEVER block or fail the test submission.
 */
export async function logTestResultToDb(doc: TestResultDocument): Promise<void> {
  try {
    const db = await getDb()
    if (!db) return // MongoDB not configured, gracefully no-op

    await db.collection('testResults').insertOne(doc)
  } catch (err) {
    console.error('[MongoDB] Failed to log candidate test result document:', err)
  }
}
