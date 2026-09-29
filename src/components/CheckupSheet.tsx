import { useState } from 'react'
import BottomSheet from './BottomSheet'
import { db, type Checkup } from '../db'
import { toDateInput } from '../date'

// よく使う健診の名前
const CHECKUP_NAMES = ['出生時', '1ヶ月健診', '3〜4ヶ月健診', '6〜7ヶ月健診', '9〜10ヶ月健診', '1歳健診', 'その他']

type Props = {
  checkup?: Checkup // 直すときは元の記録。新しく追加するときは空
  today: number
  onClose: () => void
}

// 健診の日付・名前・身長・体重を入力するパネル
function CheckupSheet({ checkup, today, onClose }: Props) {
  const [date, setDate] = useState(checkup?.date ?? toDateInput(today))
  const [name, setName] = useState(checkup?.name ?? '')
  const [height, setHeight] = useState(checkup?.heightCm?.toString() ?? '')
  const [weight, setWeight] = useState(checkup?.weightKg?.toString() ?? '')
  // 削除ボタンは2回押して確定する（押し間違い防止）
  const [confirmDelete, setConfirmDelete] = useState(false)

  const heightCm = height === '' ? undefined : Number(height)
  const weightKg = weight === '' ? undefined : Number(weight)
  const heightValid = heightCm === undefined || (heightCm >= 30 && heightCm <= 130)
  const weightValid = weightKg === undefined || (weightKg >= 0.5 && weightKg <= 30)
  // 身長か体重のどちらかは入っていること
  const valid =
    date !== '' && name !== '' && heightValid && weightValid && (heightCm !== undefined || weightKg !== undefined)

  const save = async () => {
    const values = { date, name, heightCm, weightKg }
    if (checkup) {
      await db.checkups.update(checkup.id, values)
    } else {
      await db.checkups.add(values)
    }
    onClose()
  }

  const remove = async () => {
    if (checkup) await db.checkups.delete(checkup.id)
    onClose()
  }

  return (
    <BottomSheet title={checkup ? '健診の記録を直す' : '健診の記録を追加'} onClose={onClose}>
      <label className="field">
        <span>測った日</span>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>

      <div className="field">
        <span>健診の名前</span>
        <div className="choice-grid three">
          {CHECKUP_NAMES.map((n) => (
            <button key={n} className={name === n ? 'choice selected' : 'choice'} onClick={() => setName(n)}>
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="field-row">
        <label className="field">
          <span>身長（cm）</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            placeholder="例：55.2"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
          />
        </label>
        <label className="field">
          <span>体重（kg）</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            placeholder="例：5.12"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </label>
      </div>

      <button className="primary wide" disabled={!valid} onClick={save}>
        保存
      </button>
      {checkup && (
        <button className="danger wide" onClick={confirmDelete ? remove : () => setConfirmDelete(true)}>
          {confirmDelete ? '本当に削除する' : 'この記録を削除'}
        </button>
      )}
    </BottomSheet>
  )
}

export default CheckupSheet
