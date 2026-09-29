import { useState } from 'react'
import BottomSheet from './BottomSheet'

type Props = {
  initial: number // 最初に表示する体温（前回の値）
  onSave: (temperature: number) => void
  onClose: () => void
}

// 体温を ＋－ ボタンで 0.1 度ずつ調整して記録するパネル
function TemperatureSheet({ initial, onSave, onClose }: Props) {
  // 小数の計算誤差を避けるため、10倍した整数で持つ（36.5℃ → 365）
  const [tenths, setTenths] = useState(Math.round(initial * 10))
  const step = (diff: number) => setTenths((t) => Math.min(430, Math.max(340, t + diff)))

  return (
    <BottomSheet title="体温" onClose={onClose}>
      <div className="stepper">
        <button className="stepper-button" onClick={() => step(-1)} aria-label="0.1度下げる">
          －
        </button>
        <span className="stepper-value">{(tenths / 10).toFixed(1)}℃</span>
        <button className="stepper-button" onClick={() => step(1)} aria-label="0.1度上げる">
          ＋
        </button>
      </div>
      <button className="primary wide" onClick={() => onSave(tenths / 10)}>
        記録
      </button>
    </BottomSheet>
  )
}

export default TemperatureSheet
