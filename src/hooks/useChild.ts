import { useLiveQuery } from 'dexie-react-hooks'
import { db, getChild } from '../db'
import { buildSchedule } from '../vaccineSchedule'

// 子どもの情報。読み込み中は undefined、未登録なら null
export function useChild() {
  return useLiveQuery(async () => (await getChild()) ?? null)
}

// 子どもの情報と、予防接種の状態の一覧。誕生日が未登録なら schedule は空
export function useSchedule(today: number) {
  return useLiveQuery(async () => {
    const child = (await getChild()) ?? null
    const records = await db.vaccinations.toArray()
    return { child, schedule: child ? buildSchedule(child, records, today) : [] }
  }, [today])
}
