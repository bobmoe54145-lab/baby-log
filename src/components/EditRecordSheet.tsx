import { useState } from 'react'
import BottomSheet from './BottomSheet'
import { SYMPTOMS } from '../constants'
import { db, type CareRecord } from '../db'
import { toDateTimeInput } from '../date'
import { describeRecord } from '../format'

type Props = {
  record: CareRecord
  onClose: () => void
}

// 記録1件の日時・中身・メモを直したり、削除したりするパネル
function EditRecordSheet({ record, onClose }: Props) {
  const [dateTime, setDateTime] = useState(toDateTimeInput(record.at))
  const [side, setSide] = useState(record.side ?? 'left')
  const [amount, setAmount] = useState(String(record.amountMl ?? ''))
  const [sleep, setSleep] = useState(record.sleep ?? 'asleep')
  const [temperature, setTemperature] = useState(String(record.temperature ?? ''))
  const [symptoms, setSymptoms] = useState<string[]>(record.symptoms ?? [])
  const [memo, setMemo] = useState(record.memo ?? '')
  // 削除ボタンは2回押して確定する（押し間違い防止）
  const [confirmDelete, setConfirmDelete] = useState(false)

  const at = new Date(dateTime).getTime()
  const amountMl = Number(amount)
  const temp = Number(temperature)

  // 入力内容が正しいかどうか
  const valid =
    !Number.isNaN(at) &&
    (record.type !== 'milk' || (Number.isInteger(amountMl) && amountMl > 0 && amountMl <= 400)) &&
    (record.type !== 'temperature' || (temp >= 34 && temp <= 43)) &&
    (record.type !== 'symptom' || symptoms.length > 0 || memo.trim() !== '')

  const toggleSymptom = (s: string) =>
    setSymptoms((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]))

  const save = async () => {
    // undefined を入れた項目は保存場所から消える
    await db.records.update(record.id, {
      at,
      memo: memo.trim() || undefined,
      ...(record.type === 'breast' && { side }),
      ...(record.type === 'milk' && { amountMl }),
      ...(record.type === 'sleep' && { sleep }),
      ...(record.type === 'temperature' && { temperature: Math.round(temp * 10) / 10 }),
      ...(record.type === 'symptom' && { symptoms }),
    })
    onClose()
  }

  const remove = async () => {
    await db.records.delete(record.id)
    onClose()
  }

  return (
    <BottomSheet title={`「${describeRecord(record)}」を直す`} onClose={onClose}>
      <label className="field">
        <span>日時</span>
        <input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} />
      </label>

      {record.type === 'breast' && (
        <div className="segmented">
          <button className={side === 'left' ? 'choice selected' : 'choice'} onClick={() => setSide('left')}>
            左
          </button>
          <button className={side === 'right' ? 'choice selected' : 'choice'} onClick={() => setSide('right')}>
            右
          </button>
        </div>
      )}

      {record.type === 'milk' && (
        <label className="field">
          <span>量（ml）</span>
          <input type="number" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </label>
      )}

      {record.type === 'sleep' && (
        <div className="segmented">
          <button className={sleep === 'asleep' ? 'choice selected' : 'choice'} onClick={() => setSleep('asleep')}>
            寝た
          </button>
          <button className={sleep === 'awake' ? 'choice selected' : 'choice'} onClick={() => setSleep('awake')}>
            起きた
          </button>
        </div>
      )}

      {record.type === 'temperature' && (
        <label className="field">
          <span>体温（℃）</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
          />
        </label>
      )}

      {record.type === 'symptom' && (
        <div className="choice-grid five">
          {SYMPTOMS.map((s) => (
            <button
              key={s}
              className={symptoms.includes(s) ? 'choice selected' : 'choice'}
              aria-pressed={symptoms.includes(s)}
              onClick={() => toggleSymptom(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <textarea
        className="memo"
        placeholder={record.type === 'poop' ? 'メモ（色・量など）' : 'メモ'}
        rows={2}
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
      />

      <button className="primary wide" disabled={!valid} onClick={save}>
        保存
      </button>
      <button className="danger wide" onClick={confirmDelete ? remove : () => setConfirmDelete(true)}>
        {confirmDelete ? '本当に削除する' : 'この記録を削除'}
      </button>
    </BottomSheet>
  )
}

export default EditRecordSheet
