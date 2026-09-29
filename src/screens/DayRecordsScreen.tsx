import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type CareRecord } from '../db'
import { addDays, formatDateLong, startOfDay } from '../date'
import { describeRecord, formatTime } from '../format'
import EditRecordSheet from '../components/EditRecordSheet'
import { useNow } from '../hooks/useNow'

type Props = {
  initialDay: number // 最初に表示する日（その日の0時）
  onBack: () => void
}

// 1日分の記録を新しい順に並べる画面。記録を押すと直したり消したりできる
function DayRecordsScreen({ initialDay, onBack }: Props) {
  const [day, setDay] = useState(initialDay)
  const [editing, setEditing] = useState<CareRecord | null>(null)
  const now = useNow(60_000)
  const isToday = day === startOfDay(now)

  const records = useLiveQuery(
    () => db.records.where('at').between(day, addDays(day, 1)).reverse().toArray(),
    [day],
  )

  return (
    <section>
      <header className="screen-header">
        <button className="text-button" onClick={onBack}>
          ＜ 戻る
        </button>
      </header>

      <div className="day-nav">
        <button className="text-button" onClick={() => setDay(addDays(day, -1))} aria-label="前の日">
          ＜
        </button>
        <h1>{formatDateLong(day)}</h1>
        <button
          className="text-button"
          onClick={() => setDay(addDays(day, 1))}
          disabled={isToday}
          aria-label="次の日"
        >
          ＞
        </button>
      </div>

      {records?.length === 0 && <p className="placeholder">この日の記録はありません</p>}

      <ul className="record-list">
        {records?.map((r) => (
          <li key={r.id}>
            <button className="record-row" onClick={() => setEditing(r)}>
              <span className="record-time">{formatTime(r.at)}</span>
              <span className="record-body">
                {describeRecord(r)}
                {/* 症状メモはメモも本文に含まれるので、ほかの種類だけメモを出す */}
                {r.memo && r.type !== 'symptom' && <small>{r.memo}</small>}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {editing && <EditRecordSheet record={editing} onClose={() => setEditing(null)} />}
    </section>
  )
}

export default DayRecordsScreen
