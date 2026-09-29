import { addDays, formatDateLong, formatMonthDayWeek, parseDateInput } from '../date'
import type { DoseStatus } from '../vaccineSchedule'

// 1回分の時期や記録を、画面に出す短い文にする
export function describePeriod(s: DoseStatus) {
  switch (s.state) {
    case 'done':
      return `${formatDateLong(parseDateInput(s.record!.date))} に接種済み`
    case 'reserved':
      return `${formatDateLong(parseDateInput(s.record!.date))} に予約済み`
    case 'waiting':
      return '前の回を受けたあとに時期が決まります'
    case 'overdue':
      return 'おすすめの時期を過ぎています。かかりつけ医に相談してください'
    default: {
      // until は「この日より前」なので、表示は前日にする
      const from = `${formatMonthDayWeek(s.from!)}ごろ`
      return s.until !== undefined ? `${from} 〜 ${formatMonthDayWeek(addDays(s.until, -1))}まで` : `${from}から`
    }
  }
}
