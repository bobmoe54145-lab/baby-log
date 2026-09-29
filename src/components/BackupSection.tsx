import { useRef, useState, type ChangeEvent } from 'react'
import { exportBackup, getLastBackupAt, parseBackup, restoreBackup, type BackupFile } from '../backup'
import { formatDateLong } from '../date'
import { formatTime } from '../format'

// 設定画面のバックアップ欄：記録の書き出しと、ファイルからの読み込み
function BackupSection() {
  const [lastBackupAt, setLastBackupAt] = useState(getLastBackupAt)
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null)
  // 読み込んだファイル。「元に戻す」を押すまでは、今の記録はそのまま
  const [pending, setPending] = useState<BackupFile | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const onExport = async () => {
    setMessage(null)
    try {
      const done = await exportBackup()
      if (done) {
        setLastBackupAt(getLastBackupAt())
        setMessage({ text: 'バックアップを書き出しました' })
      }
    } catch {
      setMessage({ text: '書き出しに失敗しました。もう一度試してください', error: true })
    }
  }

  const onFileChosen = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // 同じファイルをもう一度選べるように、選んだ状態を空に戻す
    e.target.value = ''
    if (!file) return
    setMessage(null)
    try {
      setPending(parseBackup(await file.text()))
    } catch (err) {
      setPending(null)
      setMessage({ text: err instanceof Error ? err.message : '読み込めませんでした', error: true })
    }
  }

  const onRestore = async () => {
    if (!pending) return
    try {
      await restoreBackup(pending)
      setPending(null)
      setMessage({ text: 'バックアップから元に戻しました' })
    } catch {
      setMessage({ text: '元に戻せませんでした。今の記録はそのまま残っています', error: true })
    }
  }

  const formatAt = (iso: string) => `${formatDateLong(Date.parse(iso))} ${formatTime(Date.parse(iso))}`

  return (
    <div className="backup">
      <p className="hint-text">
        記録はこの iPhone の中だけに保存されています。機種変更や万が一に備えて、ときどき書き出しておいてください。
      </p>
      <p className="backup-last">
        最後の書き出し：{lastBackupAt ? formatAt(lastBackupAt) : 'まだありません'}
      </p>

      <button className="primary wide" onClick={onExport}>
        バックアップを書き出す
      </button>
      <button className="choice wide-choice" onClick={() => fileInput.current?.click()}>
        バックアップから元に戻す
      </button>
      <input ref={fileInput} type="file" accept=".json,application/json" hidden onChange={onFileChosen} />

      {pending && (
        <div className="restore-confirm">
          <p>
            {formatAt(pending.exportedAt)} に書き出したファイルです。
            <br />
            お世話の記録 {pending.data.records.length} 件、健診 {pending.data.checkups.length} 件、予防接種{' '}
            {pending.data.vaccinations.length} 件が入っています。
          </p>
          <p className="restore-warning">今この iPhone にある記録はすべて消え、このファイルの中身に置き換わります。</p>
          <div className="segmented">
            <button className="choice" onClick={() => setPending(null)}>
              やめる
            </button>
            <button className="danger" onClick={onRestore}>
              置き換える
            </button>
          </div>
        </div>
      )}

      {message && <p className={message.error ? 'backup-message error' : 'backup-message'}>{message.text}</p>}
    </div>
  )
}

export default BackupSection
