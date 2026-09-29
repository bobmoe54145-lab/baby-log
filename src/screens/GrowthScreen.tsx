import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Checkup } from '../db'
import { ageInMonths, formatAge, formatMonthDay, parseDateInput, startOfDay } from '../date'
import { useNow } from '../hooks/useNow'
import { useChild } from '../hooks/useChild'
import { GROWTH_STANDARDS, type Measure } from '../data/growthStandards'
import GrowthChart from '../components/GrowthChart'
import CheckupSheet from '../components/CheckupSheet'

// グラフの横軸の右端：今の月齢より少し先まで。最低12ヶ月、最大24ヶ月
const minChartMonths = 12
const maxChartMonths = 24

// 成長画面：健診の身長・体重を記録し、成長曲線に重ねて表示する
function GrowthScreen() {
  const now = useNow(60_000)
  const today = startOfDay(now)
  const child = useChild()
  const [measure, setMeasure] = useState<Measure>('weight')
  const [selectedId, setSelectedId] = useState<number | undefined>()
  // 開いているパネル：新しく追加するときは 'new'、直すときはその記録
  const [editing, setEditing] = useState<Checkup | 'new' | null>(null)

  // 健診の記録（日付の新しい順）
  const checkups = useLiveQuery(() => db.checkups.orderBy('date').reverse().toArray())

  if (child === undefined || checkups === undefined) return null

  if (child === null) {
    return (
      <section>
        <header className="screen-header">
          <h1>成長</h1>
        </header>
        <p className="placeholder">⚙ 設定で誕生日と性別を登録すると、成長曲線が表示されます</p>
      </section>
    )
  }

  const birthday = parseDateInput(child.birthday)
  const unit = measure === 'weight' ? 'kg' : 'cm'
  const valueOf = (c: Checkup) => (measure === 'weight' ? c.weightKg : c.heightCm)

  const points = checkups
    .filter((c) => valueOf(c) !== undefined)
    .map((c) => ({ id: c.id, ageMonths: ageInMonths(birthday, parseDateInput(c.date)), value: valueOf(c)! }))
  const lastAge = Math.max(ageInMonths(birthday, today), ...points.map((p) => p.ageMonths))
  const maxMonths = Math.min(maxChartMonths, Math.max(minChartMonths, Math.ceil(lastAge + 2)))
  const standards = GROWTH_STANDARDS[child.sex][measure]

  const selected = checkups.find((c) => c.id === selectedId)

  return (
    <section>
      <header className="screen-header">
        <h1>成長</h1>
        <div className="segmented compact">
          <button
            className={measure === 'weight' ? 'choice selected' : 'choice'}
            onClick={() => setMeasure('weight')}
          >
            体重
          </button>
          <button
            className={measure === 'height' ? 'choice selected' : 'choice'}
            onClick={() => setMeasure('height')}
          >
            身長
          </button>
        </div>
      </header>

      <div className="chart-card">
        {/* 点を押したときに、その記録の中身を出す */}
        <p className="chart-readout">
          {selected && valueOf(selected) !== undefined
            ? `${selected.name}（${formatMonthDay(parseDateInput(selected.date))}・${formatAge(birthday, parseDateInput(selected.date))}）　${valueOf(selected)}${unit}`
            : '点を押すと、その日の記録が表示されます'}
        </p>
        {points.length === 0 && standards.length === 0 ? (
          <p className="placeholder">健診の記録を追加すると、グラフが表示されます</p>
        ) : (
          <GrowthChart
            standards={standards}
            points={points}
            maxMonths={maxMonths}
            unit={unit}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        )}
        {standards.length > 0 ? (
          <p className="chart-legend">
            <span className="legend-swatch outer" />
            3〜97パーセンタイル
            <span className="legend-swatch inner" />
            10〜90パーセンタイル
            <span className="legend-swatch median" />
            中央値
          </p>
        ) : (
          <p className="chart-legend">標準の範囲（灰色の帯）は、基準値を入れたあとに表示されます</p>
        )}
      </div>

      <h2 className="section-title">健診の記録</h2>
      {checkups.length === 0 ? (
        <p className="placeholder">まだ記録はありません</p>
      ) : (
        <ul className="record-list">
          {checkups.map((c) => (
            <li key={c.id}>
              <button className="record-row" onClick={() => setEditing(c)}>
                <span className="record-time">{formatMonthDay(parseDateInput(c.date))}</span>
                <span className="record-body">
                  {c.name}
                  <small>
                    {[c.heightCm !== undefined && `身長 ${c.heightCm}cm`, c.weightKg !== undefined && `体重 ${c.weightKg}kg`]
                      .filter(Boolean)
                      .join('　')}
                  </small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <button className="primary wide add-button" onClick={() => setEditing('new')}>
        ＋ 健診の記録を追加
      </button>

      {editing && (
        <CheckupSheet
          checkup={editing === 'new' ? undefined : editing}
          today={today}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  )
}

export default GrowthScreen
