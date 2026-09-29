import { useState } from 'react'
import BottomSheet from './BottomSheet'
import { db } from '../db'
import { toDateInput } from '../date'
import { doseName, type DoseStatus } from '../vaccineSchedule'
import { describePeriod } from './vaccineText'

type Props = {
  status: DoseStatus
  today: number
  onClose: () => void
}

// ワクチン1回分を「予約済み」「接種済み」にしたり、予定に戻したりするパネル
function VaccineSheet({ status, today, onClose }: Props) {
  const { vaccine, dose, record } = status
  const [date, setDate] = useState(record?.date ?? toDateInput(today))

  // 予約・接種の記録を保存する（同じ回の記録があれば上書き）
  const save = async (newStatus: 'reserved' | 'done') => {
    if (record) {
      await db.vaccinations.update(record.id, { status: newStatus, date })
    } else {
      await db.vaccinations.add({ vaccineId: vaccine.id, dose, status: newStatus, date })
    }
    onClose()
  }

  // 記録を消して「予定」に戻す
  const reset = async () => {
    if (record) await db.vaccinations.delete(record.id)
    onClose()
  }

  const period = describePeriod(status)

  return (
    <BottomSheet title={doseName(status)} onClose={onClose}>
      {period && <p className="vaccine-period">{period}</p>}
      {vaccine.note && <p className="placeholder">{vaccine.note}</p>}

      <label className="field">
        <span>予約日・接種日</span>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>

      <div className="segmented">
        <button className="choice" disabled={!date} onClick={() => save('reserved')}>
          予約済みにする
        </button>
        <button className="primary" disabled={!date} onClick={() => save('done')}>
          接種済みにする
        </button>
      </div>

      {record && (
        <button className="danger wide" onClick={reset}>
          記録を消して予定に戻す
        </button>
      )}

      <p className="hint-text">
        表示は目安です。正式な予定は自治体の案内やかかりつけ医で確認してください。
        <a href={vaccine.sourceUrl} target="_blank" rel="noreferrer">
          厚生労働省のページ
        </a>
      </p>
    </BottomSheet>
  )
}

export default VaccineSheet
