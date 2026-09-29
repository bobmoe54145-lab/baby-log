import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, getLatest, type CareRecord } from '../db'
import { addDays, formatAge, formatMonthDay, formatMonthDayWeek, isSameDay, parseDateInput, startOfDay } from '../date'
import { describeRecord, formatElapsed, formatTime } from '../format'
import { useNow } from '../hooks/useNow'
import { useSchedule } from '../hooks/useChild'
import { doseName } from '../vaccineSchedule'
import MonthCalendar from '../components/MonthCalendar'
import DayRecordsScreen from './DayRecordsScreen'

// 体温・症状を表示する期間（日数）
const HEALTH_NOTE_DAYS = 7

// 1日のまとめの行：見出しと、1日分の記録から値を計算する方法
const ROWS: { label: string; unit: string; value: (records: CareRecord[]) => number }[] = [
  { label: '授乳', unit: '回', value: (rs) => rs.filter((r) => r.type === 'breast').length },
  {
    label: 'ミルク',
    unit: 'ml',
    value: (rs) => rs.filter((r) => r.type === 'milk').reduce((sum, r) => sum + (r.amountMl ?? 0), 0),
  },
  { label: 'おしっこ', unit: '回', value: (rs) => rs.filter((r) => r.type === 'pee').length },
  { label: 'うんち', unit: '回', value: (rs) => rs.filter((r) => r.type === 'poop').length },
]

// まとめ画面：受診のときに医師にそのまま見せる1画面
function SummaryScreen() {
  const now = useNow(60_000)
  const today = startOfDay(now)
  // カレンダーで選んだ日（その日の0時）。最初は今日
  const [selectedDay, setSelectedDay] = useState(today)
  // 「記録を見る・直す」で開く日。null なら まとめ を表示
  const [openDay, setOpenDay] = useState<number | null>(null)

  const vaccineData = useSchedule(today)
  const child = vaccineData?.child
  // 接種済みのワクチン（接種日の順）
  const doneVaccines = (vaccineData?.schedule ?? [])
    .filter((s) => s.state === 'done')
    .sort((a, b) => a.record!.date.localeCompare(b.record!.date))

  // 選んだ日の記録
  const dayRecords = useLiveQuery(
    () => db.records.where('at').between(selectedDay, addDays(selectedDay, 1)).toArray(),
    [selectedDay],
  )

  // 直近1週間の体温と症状（新しい順）
  const noteStart = addDays(today, -(HEALTH_NOTE_DAYS - 1))
  const healthNotes = useLiveQuery(
    async () =>
      (await db.records.where('at').aboveOrEqual(noteStart).reverse().toArray()).filter(
        (r) => r.type === 'temperature' || r.type === 'symptom',
      ),
    [noteStart],
  )

  // 日付に関係なく、種類ごとの最後の記録
  const last = useLiveQuery(async () => {
    const [breast, milk, pee, poop] = await Promise.all([
      getLatest('breast'),
      getLatest('milk'),
      getLatest('pee'),
      getLatest('poop'),
    ])
    return { breast, milk, pee, poop }
  })

  // いちばん新しい体重の記録
  const latestWeight = useLiveQuery(async () =>
    (await db.checkups.orderBy('date').reverse().toArray()).find((c) => c.weightKg !== undefined),
  )

  if (openDay !== null) {
    return <DayRecordsScreen initialDay={openDay} onBack={() => setOpenDay(null)} />
  }

  // 最後の記録の時刻：今日なら時刻だけ、それより前なら日付も付ける
  const lastTime = (r: CareRecord | undefined) => {
    if (!r) return 'なし'
    const time = isSameDay(r.at, now) ? formatTime(r.at) : `${formatMonthDay(r.at)} ${formatTime(r.at)}`
    return `${time}（${formatElapsed(now - r.at)}前）`
  }

  return (
    <section>
      <header className="screen-header">
        <div className="child-title">
          <h1>{child ? child.name : 'まとめ'}</h1>
          {child && (
            <span>
              {formatAge(parseDateInput(child.birthday), now)} ／ {child.sex === 'male' ? '男の子' : '女の子'}
            </span>
          )}
        </div>
      </header>

      <dl className="last-list">
        <dt>最後の授乳</dt>
        <dd>
          {lastTime(last?.breast)}
          {last?.breast && ` ${last.breast.side === 'left' ? '左' : '右'}`}
        </dd>
        <dt>最後のミルク</dt>
        <dd>
          {lastTime(last?.milk)}
          {last?.milk && ` ${last.milk.amountMl}ml`}
        </dd>
        <dt>最後のおしっこ</dt>
        <dd>{lastTime(last?.pee)}</dd>
        <dt>最後のうんち</dt>
        <dd>{lastTime(last?.poop)}</dd>
        <dt>最新の体重</dt>
        <dd>
          {latestWeight
            ? `${latestWeight.weightKg}kg（${latestWeight.name} ${formatMonthDay(parseDateInput(latestWeight.date))}）`
            : 'なし'}
        </dd>
      </dl>

      <div className="day-summary-row">
        <div className="day-summary">
          <h2>{selectedDay === today ? '今日' : formatMonthDayWeek(selectedDay)}</h2>
          <dl>
            {ROWS.map((row) => (
              <div key={row.label} className="day-summary-item">
                <dt>{row.label}</dt>
                <dd>
                  {row.value(dayRecords ?? [])}
                  <small>{row.unit}</small>
                </dd>
              </div>
            ))}
          </dl>
          <button className="day-link" onClick={() => setOpenDay(selectedDay)}>
            記録を見る・直す
          </button>
        </div>
        <MonthCalendar selected={selectedDay} today={today} onSelect={setSelectedDay} />
      </div>

      <h2 className="section-title">体温・症状（直近1週間）</h2>
      {healthNotes?.length === 0 ? (
        <p className="placeholder">この期間の記録はありません</p>
      ) : (
        <ul className="note-list">
          {healthNotes?.map((r) => (
            <li key={r.id}>
              <span className="record-time">
                {formatMonthDay(r.at)} {formatTime(r.at)}
              </span>
              {describeRecord(r)}
            </li>
          ))}
        </ul>
      )}

      <h2 className="section-title">予防接種（接種済み）</h2>
      {doneVaccines.length === 0 ? (
        <p className="placeholder">接種済みの記録はありません</p>
      ) : (
        <ul className="note-list">
          {doneVaccines.map((s) => (
            <li key={`${s.vaccine.id}-${s.dose}`}>
              <span className="record-time">{formatMonthDay(parseDateInput(s.record!.date))}</span>
              {doseName(s)}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default SummaryScreen
