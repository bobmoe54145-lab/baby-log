import { useState } from 'react'
import BottomSheet from './BottomSheet'

// 選べるミルクの量（20ml 刻み、20〜160ml）
const AMOUNTS = [20, 40, 60, 80, 100, 120, 140, 160]

type Props = {
  onSelect: (amountMl: number) => void
  onClose: () => void
}

// ミルクの量を選ぶパネル。初めての記録と「量を変える」のときに使う
function MilkSheet({ onSelect, onClose }: Props) {
  // 「その他」で入力中の数字
  const [custom, setCustom] = useState('')
  const customAmount = Number(custom)
  const customValid = Number.isInteger(customAmount) && customAmount > 0 && customAmount <= 400

  return (
    <BottomSheet title="ミルクの量" onClose={onClose}>
      <div className="choice-grid">
        {AMOUNTS.map((ml) => (
          <button key={ml} className="choice" onClick={() => onSelect(ml)}>
            {ml}ml
          </button>
        ))}
      </div>
      <div className="custom-row">
        <input
          type="number"
          inputMode="numeric"
          placeholder="その他（ml）"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
        />
        <button
          className="primary"
          disabled={!customValid}
          onClick={() => onSelect(customAmount)}
        >
          記録
        </button>
      </div>
    </BottomSheet>
  )
}

export default MilkSheet
