import type { ChildProfile, Vaccination } from './db'
import { getVaccineRules, type DoseRule, type VaccineRule } from './data/vaccines'
import { addDays, parseDateInput } from './date'

// 「そろそろ受けられる」に入れる日数（おすすめの時期の何日前から出すか）
const SOON_DAYS = 14

// 1回分の状態
//   done: 接種済み / reserved: 予約済み / soon: そろそろ受けられる
//   overdue: 期間を過ぎた / later: まだ先 / waiting: 前の回を受けてから決まる
export type DoseState = 'done' | 'reserved' | 'soon' | 'overdue' | 'later' | 'waiting'

export type DoseStatus = {
  vaccine: VaccineRule
  rule: DoseRule
  dose: number // 何回目か（1から）
  state: DoseState
  record?: Vaccination
  from?: number // おすすめの時期の始まり
  until?: number // この日より前に受ける
}

// 子どもの情報と記録から、全ワクチン・全回の状態を計算する
export function buildSchedule(child: ChildProfile, records: Vaccination[], today: number): DoseStatus[] {
  const birth = parseDateInput(child.birthday)
  const result: DoseStatus[] = []

  for (const vaccine of getVaccineRules(child)) {
    // 前の回の接種日（接種済みのときだけ）
    let prev: number | undefined
    let prevDone = true

    vaccine.doses.forEach((rule, i) => {
      const dose = i + 1
      const record = records.find((r) => r.vaccineId === vaccine.id && r.dose === dose)
      const ctx = { birth, prev }
      const base = { vaccine, rule, dose, record }

      if (record?.status === 'done') {
        result.push({ ...base, state: 'done' })
      } else if (record?.status === 'reserved') {
        result.push({ ...base, state: 'reserved' })
      } else if (rule.needsPrev && !prevDone) {
        result.push({ ...base, state: 'waiting' })
      } else {
        const from = rule.from(ctx)
        const until = rule.until?.(ctx)
        const state: DoseState =
          until !== undefined && today >= until ? 'overdue' : from <= addDays(today, SOON_DAYS) ? 'soon' : 'later'
        result.push({ ...base, state, from, until })
      }

      prevDone = record?.status === 'done'
      prev = prevDone ? parseDateInput(record!.date) : undefined
    })
  }
  return result
}

// ホーム画面に出す「次の予防接種」：いちばん近い予約日と、その日のワクチン
export function nextReservation(schedule: DoseStatus[], today: number) {
  const upcoming = schedule
    .filter((s) => s.state === 'reserved' && parseDateInput(s.record!.date) >= today)
    .sort((a, b) => a.record!.date.localeCompare(b.record!.date))
  if (upcoming.length === 0) return undefined
  const date = upcoming[0].record!.date
  return { date, doses: upcoming.filter((s) => s.record!.date === date) }
}

// 「5種混合 1回目」のような名前
export function doseName(s: DoseStatus) {
  return `${s.vaccine.name} ${s.rule.label}`
}
