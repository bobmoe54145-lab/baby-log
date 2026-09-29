import { db, type CareRecord, type Checkup, type ChildProfile, type Vaccination } from './db'
import { toDateInput } from './date'

// バックアップファイルの中身
export type BackupFile = {
  app: 'baby-log' // このアプリのファイルかどうかの目印
  formatVersion: 1 // ファイルの形の版。形を変えたら数字を上げる
  exportedAt: string // 書き出した日時
  data: {
    records: CareRecord[]
    settings: ChildProfile[]
    vaccinations: Vaccination[]
    checkups: Checkup[]
  }
}

// 最後にバックアップした日時をしまう場所（この端末のブラウザだけに保存）
const LAST_BACKUP_KEY = 'baby-log:lastBackupAt'

// 保存場所の中身をすべて読み出して、バックアップファイルの形にする
export async function createBackup(): Promise<BackupFile> {
  const [records, settings, vaccinations, checkups] = await Promise.all([
    db.records.toArray(),
    db.settings.toArray(),
    db.vaccinations.toArray(),
    db.checkups.toArray(),
  ])
  return {
    app: 'baby-log',
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    data: { records, settings, vaccinations, checkups },
  }
}

// バックアップを JSON ファイルにして、iPhone の共有メニュー（「ファイルに保存」など）か、ダウンロードで保存する
export async function exportBackup() {
  const backup = await createBackup()
  const fileName = `baby-log-backup-${toDateInput(Date.now())}.json`
  const file = new File([JSON.stringify(backup)], fileName, { type: 'application/json' })

  let shared = false
  // iPhone では共有メニューから「ファイル」アプリや iCloud Drive に保存できる
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      shared = true
    } catch (e) {
      // 共有メニューを閉じただけのときは何もしない
      if (e instanceof DOMException && e.name === 'AbortError') return false
      // 共有メニューが使えなかったときは、下のダウンロードに切り替える
    }
  }
  if (!shared) download(file)

  setLastBackupAt(backup.exportedAt)
  return true
}

// ファイルをダウンロードとして保存する（パソコンなど）
function download(file: File) {
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  a.click()
  // すぐに消すとダウンロードが始まらないことがあるので、少し待ってから消す
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ファイルの中身を読み、このアプリのバックアップとして正しい形か確かめる。正しくなければ理由を投げる
export function parseBackup(text: string): BackupFile {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error('ファイルを読み取れませんでした。このアプリで書き出したファイルを選んでください')
  }
  const b = json as Partial<BackupFile>
  if (b?.app !== 'baby-log' || !b.data) {
    throw new Error('このアプリのバックアップファイルではありません')
  }
  if (b.formatVersion !== 1) {
    throw new Error('このバージョンのアプリでは読み込めないファイルです')
  }
  const { records, settings, vaccinations, checkups } = b.data
  if (![records, settings, vaccinations, checkups].every(Array.isArray)) {
    throw new Error('ファイルの中身が壊れています')
  }
  return b as BackupFile
}

// 今の記録をすべて消して、バックアップの中身に置き換える
export async function restoreBackup(backup: BackupFile) {
  const { records, settings, vaccinations, checkups } = backup.data
  // 途中で失敗したら、全部なかったことにする（元の記録が半端に消えないように）
  await db.transaction('rw', [db.records, db.settings, db.vaccinations, db.checkups], async () => {
    await Promise.all([db.records.clear(), db.settings.clear(), db.vaccinations.clear(), db.checkups.clear()])
    await Promise.all([
      db.records.bulkAdd(records),
      db.settings.bulkAdd(settings),
      db.vaccinations.bulkAdd(vaccinations),
      db.checkups.bulkAdd(checkups),
    ])
  })
}

// 最後にバックアップした日時。保存場所が使えないときは null
export function getLastBackupAt() {
  try {
    return localStorage.getItem(LAST_BACKUP_KEY)
  } catch {
    return null
  }
}

function setLastBackupAt(iso: string) {
  try {
    localStorage.setItem(LAST_BACKUP_KEY, iso)
  } catch {
    // 保存できなくても、バックアップ自体はできているので気にしない
  }
}
