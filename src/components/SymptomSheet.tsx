import { useState } from 'react'
import BottomSheet from './BottomSheet'
import { SYMPTOMS } from '../constants'

type Props = {
  onSave: (symptoms: string[], memo: string) => void
  onClose: () => void
}

// 症状を選ぶか、文字で入力して記録するパネル
function SymptomSheet({ onSave, onClose }: Props) {
  const [selected, setSelected] = useState<string[]>([])
  const [memo, setMemo] = useState('')

  // 押すたびに選択・解除を切り替える
  const toggle = (s: string) =>
    setSelected((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]))

  const canSave = selected.length > 0 || memo.trim() !== ''

  return (
    <BottomSheet title="症状メモ" onClose={onClose}>
      <div className="choice-grid five">
        {SYMPTOMS.map((s) => (
          <button
            key={s}
            className={selected.includes(s) ? 'choice selected' : 'choice'}
            aria-pressed={selected.includes(s)}
            onClick={() => toggle(s)}
          >
            {s}
          </button>
        ))}
      </div>
      <textarea
        className="memo"
        placeholder="メモ（自由に入力）"
        rows={2}
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
      />
      <button className="primary wide" disabled={!canSave} onClick={() => onSave(selected, memo.trim())}>
        記録
      </button>
    </BottomSheet>
  )
}

export default SymptomSheet
