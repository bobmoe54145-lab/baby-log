import { useState } from 'react'
import { parseDateInput, startOfDay } from '../date'
import { useNow } from '../hooks/useNow'
import { useSchedule } from '../hooks/useChild'
import { doseName, type DoseState, type DoseStatus } from '../vaccineSchedule'
import { describePeriod } from '../components/vaccineText'
import VaccineSheet from '../components/VaccineSheet'

// 画面に並べるグループと、そこに入れる状態
const GROUPS: { title: string; states: DoseState[] }[] = [
  { title: '予約済み', states: ['reserved'] },
  { title: 'そろそろ受けられる', states: ['overdue', 'soon'] },
  { title: 'これから', states: ['later', 'waiting'] },
  { title: '接種済み', states: ['done'] },
]

// 予防接種画面：ワクチンごとの予定・予約・接種済みを管理する
function VaccineScreen() {
  const today = startOfDay(useNow(60_000))
  const data = useSchedule(today)
  // 押したワクチンの「ワクチン名＋回数」。パネルを開いている間も最新の状態を使うため、キーで持つ
  const [openKey, setOpenKey] = useState<string | null>(null)

  const keyOf = (s: DoseStatus) => `${s.vaccine.id}-${s.dose}`
  const opened = data?.schedule.find((s) => keyOf(s) === openKey)

  // 並べる順：予約済み・接種済みは日付順、それ以外はおすすめの時期の順
  const sortKey = (s: DoseStatus) => (s.record ? parseDateInput(s.record.date) : (s.from ?? Infinity))

  return (
    <section>
      <header className="screen-header">
        <h1>予防接種</h1>
      </header>

      {data?.child === null && <p className="placeholder">⚙ 設定で誕生日を登録すると、予定が表示されます</p>}

      {data?.child &&
        GROUPS.map((group) => {
          const items = data.schedule
            .filter((s) => group.states.includes(s.state))
            .sort((a, b) => sortKey(a) - sortKey(b))
          if (items.length === 0) return null
          return (
            <div key={group.title} className="vaccine-group">
              <h2 className="section-title">{group.title}</h2>
              <ul className="vaccine-list">
                {items.map((s) => (
                  <li key={keyOf(s)}>
                    <button className={`vaccine-row ${s.state}`} onClick={() => setOpenKey(keyOf(s))}>
                      <span className="vaccine-name">{doseName(s)}</span>
                      <small>{describePeriod(s)}</small>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}

      {data?.child && (
        <p className="hint-text">
          0歳で受ける定期接種を表示しています。表示は目安です。正式な予定は自治体の案内やかかりつけ医で確認してください。
        </p>
      )}

      {opened && <VaccineSheet status={opened} today={today} onClose={() => setOpenKey(null)} />}
    </section>
  )
}

export default VaccineScreen
