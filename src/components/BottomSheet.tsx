import type { ReactNode } from 'react'

type Props = {
  title: string
  onClose: () => void
  children: ReactNode
}

// 画面の下からせり上がる入力パネル。外側を押すと閉じる
function BottomSheet({ title, onClose, children }: Props) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <header className="sheet-header">
          <h2>{title}</h2>
          <button className="text-button" onClick={onClose}>
            閉じる
          </button>
        </header>
        {children}
      </div>
    </div>
  )
}

export default BottomSheet
