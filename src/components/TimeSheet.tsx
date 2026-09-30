import { useState } from 'react'
import BottomSheet from './BottomSheet'
import { toDateTimeInput } from '../date'
import { formatTime } from '../format'
import { useNow } from '../hooks/useNow'

// 「◯分前」ですぐ選べる時間（分）
const MINUTES_AGO = [5, 10, 15, 30, 60, 90, 120, 180]

type Props = {
  title: string // 何の記録の時間を直すか（例：「授乳（左）」の時間）
  at: number // 今の記録の時刻
  onSave: (at: number) => void
  onClose: () => void
}

// 「◯分前」を押すか、日時を入れて、記録の時間を直すパネル
function TimeSheet({ title, at, onSave, onClose }: Props) {
  const now = useNow()
  const [dateTime, setDateTime] = useState(toDateTimeInput(at))
  const newAt = new Date(dateTime).getTime()
  // 未来の時刻にはしない（1分の余裕をみる）
  const valid = !Number.isNaN(newAt) && newAt <= now + 60_000

  const label = (m: number) => (m < 60 ? `${m}分前` : `${m / 60}時間前`)

  return (
    <BottomSheet title={title} onClose={onClose}>
      <p className="placeholder">今の記録：{formatTime(at)}</p>

      <div className="choice-grid">
        {MINUTES_AGO.map((m) => (
          <button key={m} className="choice" onClick={() => onSave(Date.now() - m * 60_000)}>
            {label(m)}
          </button>
        ))}
      </div>

      <label className="field">
        <span>日時を指定する</span>
        <input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} />
      </label>
      <button className="primary wide" disabled={!valid} onClick={() => onSave(newAt)}>
        この日時にする
      </button>
    </BottomSheet>
  )
}

export default TimeSheet
