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

export async function getMessageByIdFromDB(
  messageId: number
): Promise<(MessageDetailDTO & { sendTimeMs?: number }) | undefined> {
  const db = await dbPromise
  return db.get('messages', messageId)
}

/**
 * 某会话在本地库中的全部消息（时间升序，不含已撤回）
 */
export async function getAllMessagesForConvFromDB(
  convId: number
): Promise<MessageDetailDTO[]> {
  const db = await dbPromise
  const tx = db.transaction('messages', 'readonly')
  const index = tx.store.index('by-convId-sendTimeMs')
  const range = IDBKeyRange.bound([convId, -Infinity], [convId, Infinity])
  const all = await index.getAll(range)
  if (!all?.length) return []

  const filtered = all.filter((m) => !m.isRecalled)
  return filtered.sort((a, b) => {
    const aMs = (a as MessageDetailDTO & { sendTimeMs?: number }).sendTimeMs ?? Date.parse(a.sendTime)
    const bMs = (b as MessageDetailDTO & { sendTimeMs?: number }).sendTimeMs ?? Date.parse(b.sendTime)
    return aMs - bMs
  })
}

/**
 * 若锚点消息在本地且属于该会话，则截取 [anchor - windowSize, anchor + windowSize]（时间序，含锚点）
 * 否则返回 null，由调用方请求后端 /around
 */
export async function tryGetMessagesAroundFromDB(
  convId: number,
  anchorMessageId: number,
  windowSize: number
): Promise<MessageDetailDTO[] | null> {
  const anchor = await getMessageByIdFromDB(anchorMessageId)
  if (!anchor || anchor.isRecalled || anchor.convId !== convId) {
    return null
  }

  const ordered = await getAllMessagesForConvFromDB(convId)
  const idx = ordered.findIndex((m) => m.messageId === anchorMessageId)
  if (idx === -1) return null

  const start = Math.max(0, idx - windowSize)
  const end = Math.min(ordered.length, idx + windowSize + 1)
  return ordered.slice(start, end)
}

/**
 * 在当前会话本地缓存中按关键词搜索（正文 + 展示名相关字段），结果按时间倒序，支持分页
 */
export async function searchMessagesInConvFromDB(
  convId: number,
  keyword: string,
  page: number,
  pageSize: number
): Promise<{ messages: MessageDetailDTO[]; total: number }> {
  const normalized = (keyword || '').trim().toLowerCase()
  if (!normalized) {
    return { messages: [], total: 0 }
  }

  const ordered = await getAllMessagesForConvFromDB(convId)
  const hits = ordered.filter((m) => {
    const text = [
      m.messageContent,
      m.displayName,
      m.memberNickname,
      m.privateDisplayName
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return text.includes(normalized)
  })

  hits.sort((a, b) => {
    const aMs = (a as MessageDetailDTO & { sendTimeMs?: number }).sendTimeMs ?? Date.parse(a.sendTime)
    const bMs = (b as MessageDetailDTO & { sendTimeMs?: number }).sendTimeMs ?? Date.parse(b.sendTime)
    return bMs - aMs
  })

  const total = hits.length
  const start = (page - 1) * pageSize
  const slice = hits.slice(start, start + pageSize)
  return { messages: slice, total }
}
