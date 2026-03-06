import { openDB, type DBSchema } from 'idb'
import type { MessageDetailDTO } from '@/types/dto/message'

interface KomunifDB extends DBSchema {
  messages: {
    key: number
    value: MessageDetailDTO & {
      sendTimeMs: number
    }
    indexes: {
      'by-convId-sendTimeMs': [number, number]
    }
  }
}

const DB_NAME = 'komunif-db'
const DB_VERSION = 1

export const dbPromise = openDB<KomunifDB>(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('messages')) {
      const msgStore = db.createObjectStore('messages', { keyPath: 'messageId' })
      msgStore.createIndex('by-convId-sendTimeMs', ['convId', 'sendTimeMs'])
    }
  }
})

export async function saveMessagesToDB(messages: MessageDetailDTO[]): Promise<void> {
  if (!messages || messages.length === 0) return

  const db = await dbPromise
  const tx = db.transaction('messages', 'readwrite')

  for (const msg of messages) {
    await tx.store.put({
      ...msg,
      sendTimeMs: Date.parse(msg.sendTime)
    })
  }

  await tx.done
}

export async function getRecentMessagesFromDB(
  convId: number,
  limit = 200
): Promise<MessageDetailDTO[]> {
  const db = await dbPromise
  const tx = db.transaction('messages', 'readonly')
  const index = tx.store.index('by-convId-sendTimeMs')

  const range = IDBKeyRange.bound([convId, -Infinity], [convId, Infinity])
  const all = await index.getAll(range)

  if (!all || all.length === 0) return []

  const sliced = all.slice(Math.max(0, all.length - limit))

  return sliced.sort((a, b) => {
    const aMs = (a as any).sendTimeMs as number
    const bMs = (b as any).sendTimeMs as number
    return aMs - bMs
  })
}

