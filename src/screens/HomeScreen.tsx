import { useCallback, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { addRecord, db, getLatest, getLatestFeeding, type CareRecord } from '../db'
import { describeRecord, formatElapsed, formatTime } from '../format'
import { formatAge, formatDateLong, parseDateInput, startOfDay } from '../date'
import { useNow } from '../hooks/useNow'
import { useSchedule } from '../hooks/useChild'
import { doseName, nextReservation, type DoseStatus } from '../vaccineSchedule'
import Toast, { type ToastAction } from '../components/Toast'
import MilkSheet from '../components/MilkSheet'
import TemperatureSheet from '../components/TemperatureSheet'
import SymptomSheet from '../components/SymptomSheet'
import TimeSheet from '../components/TimeSheet'

type Props = {
  onOpenSettings: () => void
  onOpenVaccines: () => void
}

// 開いている入力パネル。ミルクは「量を変える」ときに変更する記録の id を持つ
type Sheet =
  | { kind: 'milk'; editId?: number }
  | { kind: 'temperature' }
  | { kind: 'symptom' }
  | { kind: 'time'; record: CareRecord } // 記録したあとに時間を直す
  | null

// 記録したあとに出すお知らせの中身
type ToastState = {
  recordId: number
  message: string
  isMilk: boolean
}

// 記録の種類を「授乳（左）」のように表す（時間を直すパネルの見出しに使う）
const recordTitle = (r: CareRecord) => `「${describeRecord(r)}」の時間`

// 体温の記録がまだないときに最初に表示する値
const DEFAULT_TEMPERATURE = 36.5

// ホーム画面：記録ボタンと「前回の授乳から◯時間◯分」を表示する
function HomeScreen({ onOpenSettings, onOpenVaccines }: Props) {
  const now = useNow()
  const [sheet, setSheet] = useState<Sheet>(null)
  const [toast, setToast] = useState<ToastState | null>(null)
  const closeToast = useCallback(() => setToast(null), [])

  // 保存場所の中身が変わると、自動で最新の値に更新される
  const latestFeeding = useLiveQuery(getLatestFeeding)
  const latestMilk = useLiveQuery(() => getLatest('milk'))
  const latestSleep = useLiveQuery(() => getLatest('sleep'))
  const latestTemperature = useLiveQuery(() => getLatest('temperature'))
  const today = startOfDay(now)
  const vaccineData = useSchedule(today)
  const child = vaccineData?.child

  const isAsleep = latestSleep?.sleep === 'asleep'

  // 記録を保存して、お知らせを出す
  const record = async (rec: Omit<CareRecord, 'id'>) => {
    const recordId = await addRecord(rec)
    setToast({
      recordId,
      message: `「${describeRecord({ ...rec, id: recordId })}」を記録しました`,
      isMilk: rec.type === 'milk',
    })
  }

  // ミルク：前回と同じ量で記録。初めてのときだけ量を選ぶ
  const onMilk = () => {
    if (latestMilk?.amountMl) {
      record({ type: 'milk', at: Date.now(), amountMl: latestMilk.amountMl })
    } else {
      setSheet({ kind: 'milk' })
    }
  }

  // ミルクの量を選んだとき：「量を変える」なら記録を直し、そうでなければ新しく記録する
  const onMilkSelected = async (amountMl: number, editId?: number) => {
    setSheet(null)
    if (editId !== undefined) {
      await db.records.update(editId, { amountMl })
      setToast({ recordId: editId, message: `ミルクを ${amountMl}ml に変更しました`, isMilk: true })
    } else {
      record({ type: 'milk', at: Date.now(), amountMl })
    }
  }

  // 時間を直したとき
  const onTimeSelected = async (target: CareRecord, at: number) => {
    setSheet(null)
    await db.records.update(target.id, { at })
    setToast({
      recordId: target.id,
      message: `「${describeRecord(target)}」を ${formatTime(at)} に変更しました`,
      isMilk: target.type === 'milk',
    })
  }

  // お知らせのボタン
  const toastActions = (t: ToastState): ToastAction[] => {
    const undo: ToastAction = {
      label: '取り消す',
      onClick: () => {
        db.records.delete(t.recordId)
        setToast(null)
      },
    }
    const changeTime: ToastAction = {
      label: '時間を変える',
      onClick: async () => {
        setToast(null)
        // 量を直したあとなどでも最新の中身を使うため、保存場所から読み直す
        const target = await db.records.get(t.recordId)
        if (target) setSheet({ kind: 'time', record: target })
      },
    }
    if (!t.isMilk) return [changeTime, undo]
    const changeAmount: ToastAction = {
      label: '量を変える',
      onClick: () => {
        setToast(null)
        setSheet({ kind: 'milk', editId: t.recordId })
      },
    }
    return [changeAmount, changeTime, undo]
  }

  return (
    <section>
      <header className="screen-header">
        <div className="child-title">
          <h1>{child ? child.name : 'ホーム'}</h1>
          {child && <span>{formatAge(parseDateInput(child.birthday), now)}</span>}
        </div>
        <button className="icon-button" onClick={onOpenSettings} aria-label="設定">
          ⚙
        </button>
      </header>

      {child === null && (
        <button className="setup-banner" onClick={onOpenSettings}>
          ⚙ 設定から、赤ちゃんの名前と誕生日を登録してください
        </button>
      )}

      <div className="elapsed-card">
        {latestFeeding ? (
          <>
            <div className="elapsed-label">前回の授乳から</div>
            <div className="elapsed-value">{formatElapsed(now - latestFeeding.at)}</div>
            <div className="elapsed-detail">
              {formatTime(latestFeeding.at)} {describeRecord(latestFeeding)}
            </div>
          </>
        ) : (
          <div className="elapsed-label">授乳の記録はまだありません</div>
        )}
      </div>

      <div className="record-grid">
        <button className="record-button" onClick={() => record({ type: 'breast', at: Date.now(), side: 'left' })}>
          授乳 左
        </button>
        <button className="record-button" onClick={() => record({ type: 'breast', at: Date.now(), side: 'right' })}>
          授乳 右
        </button>
        <button className="record-button" onClick={onMilk}>
          ミルク
          {latestMilk?.amountMl && <small>{latestMilk.amountMl}ml</small>}
        </button>
        <button
          className={isAsleep ? 'record-button asleep' : 'record-button'}
          onClick={() => record({ type: 'sleep', at: Date.now(), sleep: isAsleep ? 'awake' : 'asleep' })}
        >
          {isAsleep ? '起床' : '睡眠'}
          {isAsleep && latestSleep && <small>{formatTime(latestSleep.at)}から睡眠中</small>}
        </button>
        <button className="record-button" onClick={() => record({ type: 'pee', at: Date.now() })}>
          おしっこ
        </button>
        <button className="record-button" onClick={() => record({ type: 'poop', at: Date.now() })}>
          うんち
        </button>
        <button className="record-button" onClick={() => setSheet({ kind: 'temperature' })}>
          体温
        </button>
        <button className="record-button" onClick={() => setSheet({ kind: 'symptom' })}>
          症状メモ
        </button>
      </div>

      {child && <NextVaccine schedule={vaccineData.schedule} today={today} onClick={onOpenVaccines} />}

      {sheet?.kind === 'milk' && (
        <MilkSheet onSelect={(ml) => onMilkSelected(ml, sheet.editId)} onClose={() => setSheet(null)} />
      )}
      {sheet?.kind === 'time' && (
        <TimeSheet
          title={recordTitle(sheet.record)}
          at={sheet.record.at}
          onSave={(at) => onTimeSelected(sheet.record, at)}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet?.kind === 'temperature' && (
        <TemperatureSheet
          initial={latestTemperature?.temperature ?? DEFAULT_TEMPERATURE}
          onSave={(temperature) => {
            setSheet(null)
            record({ type: 'temperature', at: Date.now(), temperature })
          }}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet?.kind === 'symptom' && (
        <SymptomSheet
          onSave={(symptoms, memo) => {
            setSheet(null)
            record({ type: 'symptom', at: Date.now(), symptoms, ...(memo && { memo }) })
          }}
          onClose={() => setSheet(null)}
        />
      )}

      {toast && (
        <Toast key={toast.message + toast.recordId} message={toast.message} actions={toastActions(toast)} onDismiss={closeToast} />
      )}
    </section>
  )
}

type NextVaccineProps = {
  schedule: DoseStatus[]
  today: number
  onClick: () => void
}

// ホーム画面の下に出す「次の予防接種」。押すと予防接種画面へ移る
function NextVaccine({ schedule, today, onClick }: NextVaccineProps) {
  const next = nextReservation(schedule, today)
  const soon = schedule.filter((s) => s.state === 'soon' || s.state === 'overdue')

  let text = '今のところ予定はありません'
  if (next) {
    text = `${formatDateLong(parseDateInput(next.date))}　${next.doses.map(doseName).join('・')}`
  } else if (soon.length > 0) {
    const names = soon.slice(0, 2).map(doseName).join('・')
    text = `予約がまだ：${names}${soon.length > 2 ? ' ほか' : ''}`
  }

  return (
    <button className="next-vaccine" onClick={onClick}>
      <span className="next-vaccine-label">次の予防接種</span>
      <span>{text}</span>
    </button>
  )
}

export default HomeScreen
