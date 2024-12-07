import Datastore from 'nedb'
import path from 'path'
import { fileURLToPath } from 'url'
import type { DbDocs } from '../types/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const db = new Datastore<DbDocs>({
  filename: path.join(__dirname, '../../data/rooms.db'),
  autoload: true
})

export const cleanupOldRooms = () => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  db.remove({ createdAt: { $lt: oneDayAgo } }, { multi: true })
}

export default db 