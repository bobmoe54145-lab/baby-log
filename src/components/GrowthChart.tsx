import type { PercentileRow } from '../data/growthStandards'

// 赤ちゃんの記録1つ分の点
export type GrowthPoint = {
  id: number
  ageMonths: number // 月齢（小数）
  value: number
}

type Props = {
  standards: PercentileRow[] // 標準の範囲（空なら帯を描かない）
  points: GrowthPoint[]
  maxMonths: number // 横軸の右端（月齢）
  unit: string // 「kg」「cm」
  selectedId?: number
  onSelect: (id: number) => void
}

// グラフ全体の大きさと余白（画面の幅に合わせて自動で伸び縮みする）
const W = 340
const H = 256
// 上に縦軸の単位、下に横軸の説明を置くぶん、上下を広めにとる
const PAD = { left: 36, right: 12, top: 22, bottom: 40 }

// 目盛りの間隔の候補。目盛りが5本くらいになるものを選ぶ
const STEPS = [0.5, 1, 2, 5, 10, 20]

// 成長曲線のグラフ（SVG で描く）
//   灰色の薄い帯：3〜97パーセンタイル、濃い帯：10〜90パーセンタイル、点線：中央値（50パーセンタイル）
function GrowthChart({ standards, points, maxMonths, unit, selectedId, onSelect }: Props) {
  // 横軸の範囲に入る基準値（右端の外側の1つも含めて、帯が端まで届くようにする）
  const visible = standards.filter(
    (r, i) => r.ageMonths <= maxMonths || (standards[i - 1]?.ageMonths ?? Infinity) < maxMonths,
  )

  // 縦軸の範囲：帯と点がすべて入るようにする
  const values = [...visible.flatMap((r) => [r.p3, r.p97]), ...points.map((p) => p.value)]
  if (values.length === 0) return null
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  const step = STEPS.find((s) => (rawMax - rawMin) / s <= 6) ?? 50
  const yMin = Math.floor(rawMin / step) * step
  const yMax = Math.ceil(rawMax / step) * step || step

  const x = (months: number) => PAD.left + (months / maxMonths) * (W - PAD.left - PAD.right)
  const y = (value: number) => H - PAD.bottom - ((value - yMin) / (yMax - yMin)) * (H - PAD.top - PAD.bottom)

  // 上の線と下の線ではさんだ帯の形
  const band = (lower: keyof PercentileRow, upper: keyof PercentileRow) =>
    [
      ...visible.map((r) => `${x(r.ageMonths)},${y(r[upper])}`),
      ...[...visible].reverse().map((r) => `${x(r.ageMonths)},${y(r[lower])}`),
    ].join(' ')

  const yTicks: number[] = []
  for (let v = yMin; v <= yMax + 1e-9; v += step) yTicks.push(Math.round(v * 10) / 10)
  const xStep = maxMonths <= 12 ? 1 : 2
  const xTicks: number[] = []
  for (let m = 0; m <= maxMonths; m += xStep) xTicks.push(m)

  const sorted = [...points].sort((a, b) => a.ageMonths - b.ageMonths)

  return (
    <svg
      className="growth-chart"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`成長曲線。記録 ${points.length} 件`}
    >
      <defs>
        <clipPath id="plot-area">
          <rect x={PAD.left} y={PAD.top} width={W - PAD.left - PAD.right} height={H - PAD.top - PAD.bottom} />
        </clipPath>
      </defs>

      {/* 目盛りの線と数字 */}
      {yTicks.map((v) => (
        <g key={`y${v}`}>
          <line className="chart-grid" x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} />
          <text className="chart-tick" x={PAD.left - 6} y={y(v)} textAnchor="end" dominantBaseline="middle">
            {v}
          </text>
        </g>
      ))}
      {xTicks.map((m) => (
        <text key={`x${m}`} className="chart-tick" x={x(m)} y={H - PAD.bottom + 14} textAnchor="middle">
          {m}
        </text>
      ))}
      <text className="chart-tick" x={PAD.left - 6} y={10} textAnchor="end">
        （{unit}）
      </text>
      <text className="chart-tick" x={(PAD.left + W - PAD.right) / 2} y={H - 4} textAnchor="middle">
        月齢（ヶ月）
      </text>

      {/* 標準の範囲 */}
      {visible.length > 1 && (
        <g clipPath="url(#plot-area)">
          <polygon className="chart-band-outer" points={band('p3', 'p97')} />
          <polygon className="chart-band-inner" points={band('p10', 'p90')} />
          <polyline
            className="chart-median"
            points={visible.map((r) => `${x(r.ageMonths)},${y(r.p50)}`).join(' ')}
          />
        </g>
      )}

      {/* 赤ちゃんの記録 */}
      {sorted.length > 1 && (
        <polyline className="chart-line" points={sorted.map((p) => `${x(p.ageMonths)},${y(p.value)}`).join(' ')} />
      )}
      {sorted.map((p) => (
        <g key={p.id} className="chart-point-group" onClick={() => onSelect(p.id)}>
          {/* 指で押しやすいよう、見えない大きな円を重ねる */}
          <circle className="chart-hit" cx={x(p.ageMonths)} cy={y(p.value)} r={14} />
          <circle
            className={p.id === selectedId ? 'chart-point selected' : 'chart-point'}
            cx={x(p.ageMonths)}
            cy={y(p.value)}
            r={p.id === selectedId ? 6 : 5}
          />
        </g>
      ))}
    </svg>
  )
}

export default GrowthChart
