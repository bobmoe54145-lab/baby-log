import { Dexie, type EntityTable } from 'dexie'

// 記録の種類
export type RecordType =
  | 'breast' // 授乳
  | 'milk' // ミルク
  | 'pee' // おしっこ
  | 'poop' // うんち
  | 'sleep' // 睡眠（寝た・起きた）
  | 'temperature' // 体温
  | 'symptom' // 症状メモ

// お世話の記録1件分。種類によって使う項目が違う
export type CareRecord = {
  id: number
  type: RecordType
  at: number // 記録した日時（ミリ秒）
  side?: 'left' | 'right' // 授乳の左右
  amountMl?: number // ミルクの量
  sleep?: 'asleep' | 'awake' // 寝た・起きた
  temperature?: number // 体温（℃）
  symptoms?: string[] // 選んだ症状
  memo?: string // 自由入力のメモ
}

// 子どもの情報（設定画面で登録する）。1件だけ保存する
export type ChildProfile = {
  id: 'child'
  name: string
  birthday: string // 誕生日（「2026-07-29」の形）
  sex: 'male' | 'female'
  rotaType?: 'monovalent' | 'pentavalent' // ロタワクチンの種類（1価・5価）。未定なら空
}

// 予防接種1回分の予約・接種の記録。まだ何もしていない回は保存しない
export type Vaccination = {
  id: number
  vaccineId: string // ワクチンの種類（src/data/vaccines.ts の id）
  dose: number // 何回目か（1から数える）
  status: 'reserved' | 'done' // 予約済み・接種済み
  date: string // 予約日または接種日（「2026-10-15」の形）
}

// 健診などで測った身長・体重の記録
export type Checkup = {
  id: number
  date: string // 測った日（「2026-08-26」の形）
  name: string // 「1ヶ月健診」など
  heightCm?: number // 身長（cm）
  weightKg?: number // 体重（kg）
}

// iPhone のブラウザの中にある保存場所（IndexedDB）
export const db = new Dexie('baby-log') as Dexie & {
  records: EntityTable<CareRecord, 'id'>
  settings: EntityTable<ChildProfile, 'id'>
  vaccinations: EntityTable<Vaccination, 'id'>
  checkups: EntityTable<Checkup, 'id'>
}

// 保存場所の形。'at' などは検索に使う項目
db.version(1).stores({
  records: '++id, at, type, [type+at]',
})

// 2つ目の版：子どもの情報と予防接種の記録をしまう場所を追加
db.version(2).stores({
  records: '++id, at, type, [type+at]',
  settings: 'id',
  vaccinations: '++id, &[vaccineId+dose], status',
})

// 3つ目の版：健診の身長・体重をしまう場所を追加
db.version(3).stores({
  records: '++id, at, type, [type+at]',
  settings: 'id',
  vaccinations: '++id, &[vaccineId+dose], status',
  checkups: '++id, date',
})

// 子どもの情報を返す（まだ登録していなければ undefined）
export function getChild() {
  return db.settings.get('child')
}

// 記録を1件追加して、その id を返す
export function addRecord(record: Omit<CareRecord, 'id'>) {
  return db.records.add(record)
}

// 指定した種類の中で、いちばん新しい記録を返す
export function getLatest(type: RecordType) {
  return db.records
    .where('[type+at]')
    .between([type, Dexie.minKey], [type, Dexie.maxKey])
    .last()
}

// 授乳またはミルクの中で、いちばん新しい記録を返す
export async function getLatestFeeding() {
  const [breast, milk] = await Promise.all([getLatest('breast'), getLatest('milk')])
  if (!breast) return milk
  if (!milk) return breast
  return breast.at > milk.at ? breast : milk
}
