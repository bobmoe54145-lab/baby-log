import type { CareRecord } from './db'

// 時刻を「14:30」の形にする
export function formatTime(ms: number) {
  const d = new Date(ms)
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

// 経過時間を「2時間15分」の形にする
export function formatElapsed(ms: number) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours > 0 ? `${hours}時間${minutes}分` : `${minutes}分`
}

// 記録の中身を「授乳（左）」「ミルク 100ml」などの短い文にする
export function describeRecord(r: CareRecord) {
  switch (r.type) {
    case 'breast':
      return `授乳（${r.side === 'left' ? '左' : '右'}）`
    case 'milk':
      return `ミルク ${r.amountMl}ml`
    case 'pee':
      return 'おしっこ'
    case 'poop':
      return 'うんち'
    case 'sleep':
      return r.sleep === 'asleep' ? '寝た' : '起きた'
    case 'temperature':
      return `体温 ${r.temperature?.toFixed(1)}℃`
    case 'symptom':
      return `症状：${[...(r.symptoms ?? []), r.memo].filter(Boolean).join('、')}`
  }
}
