// Saves an in-progress scheme application (selected scheme + uploaded
// document photos) to the browser's IndexedDB, so that if the connection
// drops mid-process, nothing is lost - the draft can be restored and
// automatically resumed once back online. Uses IndexedDB rather than
// localStorage because it can store the actual photo files directly
// (localStorage has a much smaller size limit and can't hold binary data).

const DB_NAME = 'yojana_mitra_db'
const STORE_NAME = 'application_draft'
const DRAFT_KEY = 'current_draft'

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveDraft(draft) {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).put({ ...draft, savedAt: Date.now() }, DRAFT_KEY)
      tx.oncomplete = () => resolve(true)
      tx.onerror = () => reject(tx.error)
    })
  } catch (e) {
    console.warn('Could not save application draft:', e)
    return false
  }
}

export async function loadDraft() {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const request = tx.objectStore(STORE_NAME).get(DRAFT_KEY)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  } catch (e) {
    return null
  }
}

export async function clearDraft() {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).delete(DRAFT_KEY)
      tx.oncomplete = () => resolve(true)
      tx.onerror = () => resolve(false)
    })
  } catch (e) {
    return false
  }
}
