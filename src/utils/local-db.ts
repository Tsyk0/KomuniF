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

/**
 * 在本地 IndexedDB 中按关键词搜索消息，并返回命中的会话 ID 列表（按最新消息时间倒序）
 */
export async function findConversationIdsByKeywordFromDB(
  keyword: string,
  options?: { convIds?: number[]; maxConversations?: number }
): Promise<number[]> {
  const normalized = (keyword || '').trim().toLowerCase()
  if (!normalized) return []

  const db = await dbPromise
  const tx = db.transaction('messages', 'readonly')
  const all = await tx.store.getAll()

  if (!all || all.length === 0) return []

  const convFilter = options?.convIds ? new Set(options.convIds) : null
  const convLatestHitTime = new Map<number, number>()

  for (const msg of all) {
    if (convFilter && !convFilter.has(msg.convId)) continue

    const content = (msg.messageContent || '').toLowerCase()
    if (!content.includes(normalized)) continue

    const hitTime = (msg as any).sendTimeMs || Date.parse(msg.sendTime) || 0
    const previous = convLatestHitTime.get(msg.convId) || 0
    if (hitTime > previous) {
      convLatestHitTime.set(msg.convId, hitTime)
    }
  }

  const sortedConvIds = Array.from(convLatestHitTime.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([convId]) => convId)

  const maxConversations = options?.maxConversations || 0
  if (maxConversations > 0) {
    return sortedConvIds.slice(0, maxConversations)
  }
  return sortedConvIds
}

