import { useEffect } from 'react'

export type ToastAction = {
  label: string
  onClick: () => void
}

type Props = {
  message: string
  actions: ToastAction[]
  onDismiss: () => void
}

// 表示しておく時間（ミリ秒）
const DURATION_MS = 8000

// 画面下に数秒だけ出るお知らせ。「取り消す」などのボタンを置ける
function Toast({ message, actions, onDismiss }: Props) {
  // 時間がたったら自動で消す。新しいお知らせに変わったら数え直す
  useEffect(() => {
    const timer = setTimeout(onDismiss, DURATION_MS)
    return () => clearTimeout(timer)
  }, [message, onDismiss])

  return (
    <div className="toast" role="status">
      <span className="toast-message">{message}</span>
      {actions.map((a) => (
        <button key={a.label} className="toast-action" onClick={a.onClick}>
          {a.label}
        </button>
      ))}
    </div>
  )
}

export default Toast
