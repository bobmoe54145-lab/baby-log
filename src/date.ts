const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

// その日の0時0分（ミリ秒）を返す
export function startOfDay(ms: number) {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

// n日後（マイナスなら n日前）の同じ時刻を返す。夏時間などのずれが出ないよう日付で計算する
export function addDays(ms: number, n: number) {
  const d = new Date(ms)
  d.setDate(d.getDate() + n)
  return d.getTime()
}

// 同じ日かどうか
export function isSameDay(a: number, b: number) {
  return startOfDay(a) === startOfDay(b)
}

// 「9/27」の形にする
export function formatMonthDay(ms: number) {
  const d = new Date(ms)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

// 「9月27日（土）」の形にする
export function formatDateLong(ms: number) {
  const d = new Date(ms)
  return `${d.getMonth() + 1}月${d.getDate()}日（${WEEKDAYS[d.getDay()]}）`
}

// 入力欄（datetime-local）用の「2026-09-27T14:30」の形にする
export function toDateTimeInput(ms: number) {
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// その月の1日0時を返す
export function startOfMonth(ms: number) {
  const d = new Date(ms)
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime()
}

// n か月後（マイナスなら n か月前）の1日0時を返す
export function addMonths(ms: number, n: number) {
  const d = new Date(ms)
  return new Date(d.getFullYear(), d.getMonth() + n, 1).getTime()
}

// 「2026年9月」の形にする
export function formatYearMonth(ms: number) {
  const d = new Date(ms)
  return `${d.getFullYear()}年${d.getMonth() + 1}月`
}

// 「9/27（土）」の形にする
export function formatMonthDayWeek(ms: number) {
  const d = new Date(ms)
  return `${d.getMonth() + 1}/${d.getDate()}（${WEEKDAYS[d.getDay()]}）`
}

export { WEEKDAYS }

// n か月後の同じ日を返す。その月に同じ日がなければ月末にする（1/31 の1か月後 → 2/28）
export function addMonthsKeepDay(ms: number, n: number) {
  const d = new Date(ms)
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(d.getDate(), lastDay))
  return target.getTime()
}

// 入力欄（date）の「2026-07-29」を、その日の0時（ミリ秒）にする
export function parseDateInput(value: string) {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d).getTime()
}

// その日の0時（ミリ秒）を、入力欄（date）用の「2026-07-29」にする
export function toDateInput(ms: number) {
  return toDateTimeInput(ms).slice(0, 10)
}

// 誕生日から見た月齢を、小数で返す（例：生後2ヶ月15日 → 約2.5）。グラフの横軸に使う
export function ageInMonths(birthday: number, date: number) {
  const day = startOfDay(date)
  let months = 0
  while (addMonthsKeepDay(birthday, months + 1) <= day) months++
  const start = addMonthsKeepDay(birthday, months)
  const end = addMonthsKeepDay(birthday, months + 1)
  return months + (day - start) / (end - start)
}

// 誕生日から見た月齢を「生後2ヶ月5日」の形にする
export function formatAge(birthday: number, now: number) {
  const today = startOfDay(now)
  if (today < birthday) return ''
  let months = 0
  while (addMonthsKeepDay(birthday, months + 1) <= today) months++
  const days = Math.round((today - addMonthsKeepDay(birthday, months)) / 86_400_000)
  if (months >= 12) {
    return `${Math.floor(months / 12)}歳${months % 12}ヶ月`
  }
  return `生後${months}ヶ月${days}日`
}

// 「2026/9/30(水)」の形にする（画面上部の今日の日付に使う）
export function formatFullDate(ms: number) {
  const d = new Date(ms)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}(${WEEKDAYS[d.getDay()]})`
}
