import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { WEEKDAYS, addDays, addMonths, formatYearMonth, startOfDay, startOfMonth } from '../date'

type Props = {
  selected: number // 選んでいる日（その日の0時）
  today: number // 今日（その日の0時）
  onSelect: (day: number) => void
}

// 1か月分のカレンダー。記録がある日には点を付け、押した日を選ぶ
function MonthCalendar({ selected, today, onSelect }: Props) {
  const [month, setMonth] = useState(() => startOfMonth(selected))
  const nextMonth = addMonths(month, 1)
  const isCurrentMonth = month === startOfMonth(today)

  // この月で記録がある日（0時の値）の一覧
  const markedDays = useLiveQuery(async () => {
    const ats = await db.records.where('at').between(month, nextMonth).keys()
    return new Set(ats.map((at) => startOfDay(Number(at))))
  }, [month, nextMonth])

  // カレンダーのマス：1日の前に曜日の分だけ空きを入れる
  const firstWeekday = new Date(month).getDay()
  const days: (number | null)[] = Array(firstWeekday).fill(null)
  for (let d = month; d < nextMonth; d = addDays(d, 1)) days.push(d)

  return (
    <div className="calendar">
      <div className="calendar-nav">
        <button className="text-button" onClick={() => setMonth(addMonths(month, -1))} aria-label="前の月">
          ＜
        </button>
        <span>{formatYearMonth(month)}</span>
        <button
          className="text-button"
          onClick={() => setMonth(nextMonth)}
          disabled={isCurrentMonth}
          aria-label="次の月"
        >
          ＞
        </button>
      </div>

      <div className="calendar-grid">
        {WEEKDAYS.map((w) => (
          <span key={w} className="calendar-weekday">
            {w}
          </span>
        ))}
        {days.map((d, i) =>
          d === null ? (
            <span key={`blank-${i}`} />
          ) : (
            <button
              key={d}
              className={[
                'calendar-day',
                d === selected && 'selected',
                d === today && 'today',
                markedDays?.has(d) && 'marked',
              ]
                .filter(Boolean)
                .join(' ')}
              // 未来の日は記録がないので選べないようにする
              disabled={d > today}
              onClick={() => onSelect(d)}
            >
              {new Date(d).getDate()}
            </button>
          ),
        )}
      </div>
    </div>
  )
}

export default MonthCalendar
