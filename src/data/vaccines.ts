// 0歳で受ける定期接種のルール
//
// 出典：厚生労働省「予防接種・ワクチン情報」の各ワクチンのページ（2026年9月29日に確認）
// https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/kenkou/kekkaku-kansenshou/yobou-sesshu/index.html
// 制度は改定されることがあるため、変わったらこのファイルを直す。
// 表示はあくまで目安で、正式な予定は自治体の案内やかかりつけ医で確認する。

import type { ChildProfile } from '../db'
import { addDays, addMonthsKeepDay } from '../date'

// 1回分の時期を計算するための材料
export type DoseContext = {
  birth: number // 誕生日（0時のミリ秒）
  prev?: number // 前の回の接種日（接種済みのとき）
}

// 1回分のルール
export type DoseRule = {
  label: string // 「1回目」「追加」など
  from: (c: DoseContext) => number // おすすめの時期の始まり
  // 期限や標準的な時期が終わる日の「翌日」。この日より前に受ける
  until?: (c: DoseContext) => number
  needsPrev?: boolean // 前の回を受けてから時期が決まる
}

export type VaccineRule = {
  id: string
  name: string
  note?: string
  sourceUrl: string
  doses: DoseRule[]
}

const months = (c: DoseContext, n: number) => addMonthsKeepDay(c.birth, n)
const weeksDays = (c: DoseContext, w: number, d: number) => addDays(c.birth, w * 7 + d)
// 前の回の接種日から n 日後。前の回がまだなら、最初の回の目安（生後2か月）から数える
const afterPrev = (c: DoseContext, n: number) => addDays(c.prev ?? months(c, 2), n)

const MHLW = 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/kenkou/kekkaku-kansenshou/yobou-sesshu/vaccine'

// ロタは種類によって回数と期限が違う
function rotaDoses(type: ChildProfile['rotaType']): DoseRule[] {
  // 1価は出生24週0日後、5価は出生32週0日後までに受け終わる（その翌日を期限にする）
  const lastDay = (c: DoseContext) => weeksDays(c, type === 'pentavalent' ? 32 : 24, 1)
  const first: DoseRule = {
    label: '1回目',
    from: (c) => months(c, 2),
    // 初回は出生14週6日後まで（15週0日以降はおすすめされない）
    until: (c) => weeksDays(c, 15, 0),
  }
  const next = (label: string): DoseRule => ({
    label,
    from: (c) => afterPrev(c, 27), // 27日以上あける
    until: lastDay,
    needsPrev: true,
  })
  return type === 'pentavalent' ? [first, next('2回目'), next('3回目')] : [first, next('2回目')]
}

// 子どもの情報に合わせたワクチンの一覧を返す
export function getVaccineRules(child: ChildProfile): VaccineRule[] {
  return [
    {
      id: 'rota',
      name: 'ロタウイルス',
      note:
        child.rotaType === undefined
          ? '種類（1価・5価）が未設定のため、2回で表示しています。設定で選べます'
          : child.rotaType === 'pentavalent'
            ? '5価（3回）'
            : '1価（2回）',
      sourceUrl: `${MHLW}/rota/index.html`,
      doses: rotaDoses(child.rotaType),
    },
    {
      id: 'dpt-ipv-hib',
      name: '5種混合',
      sourceUrl: `${MHLW}/dpt-ipv-hib/index.html`,
      doses: [
        // 初回は生後2〜7か月に、20〜56日の間隔で3回
        { label: '1回目', from: (c) => months(c, 2), until: (c) => months(c, 7) },
        { label: '2回目', from: (c) => afterPrev(c, 20), until: (c) => afterPrev(c, 57), needsPrev: true },
        { label: '3回目', from: (c) => afterPrev(c, 20), until: (c) => afterPrev(c, 57), needsPrev: true },
        // 追加は初回が終わってから6〜18か月
        {
          label: '追加',
          from: (c) => addMonthsKeepDay(c.prev ?? months(c, 4), 6),
          until: (c) => addMonthsKeepDay(c.prev ?? months(c, 4), 18),
          needsPrev: true,
        },
      ],
    },
    {
      id: 'pneumococcus',
      name: '小児用肺炎球菌',
      note: '生後2〜7か月に始めた場合のスケジュールです',
      sourceUrl: `${MHLW}/pneumococcus-child/index.html`,
      doses: [
        { label: '1回目', from: (c) => months(c, 2), until: (c) => months(c, 7) },
        // およそ1か月おき
        { label: '2回目', from: (c) => addMonthsKeepDay(c.prev ?? months(c, 2), 1), needsPrev: true },
        { label: '3回目', from: (c) => addMonthsKeepDay(c.prev ?? months(c, 3), 1), needsPrev: true },
        // 最後の接種から60日以上あけ、生後12か月以降
        {
          label: '追加',
          from: (c) => Math.max(afterPrev(c, 60), months(c, 12)),
          needsPrev: true,
        },
      ],
    },
    {
      id: 'hepatitis-b',
      name: 'B型肝炎',
      sourceUrl: `${MHLW}/hepatitis-b/index.html`,
      // 標準は生後2か月・3か月・7〜8か月。定期接種は1歳になるまで
      doses: [
        { label: '1回目', from: (c) => months(c, 2), until: (c) => months(c, 12) },
        { label: '2回目', from: (c) => months(c, 3), until: (c) => months(c, 12), needsPrev: true },
        { label: '3回目', from: (c) => months(c, 7), until: (c) => months(c, 12), needsPrev: true },
      ],
    },
    {
      id: 'bcg',
      name: 'BCG',
      note: '標準は生後5〜8か月。地域によって時期が違うことがあります',
      sourceUrl: `${MHLW}/bcg/index.html`,
      // 1歳になるまでに1回
      doses: [{ label: '1回', from: (c) => months(c, 5), until: (c) => months(c, 12) }],
    },
  ]
}
