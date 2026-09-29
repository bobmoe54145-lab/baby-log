import { useState } from 'react'
import { db, type ChildProfile } from '../db'
import { useChild } from '../hooks/useChild'
import BackupSection from '../components/BackupSection'

type Props = {
  onClose: () => void
}

// 設定画面：子どもの情報を登録する
function SettingsScreen({ onClose }: Props) {
  const child = useChild()

  return (
    <section>
      <header className="screen-header">
        <button className="text-button" onClick={onClose}>
          ＜ 戻る
        </button>
        <h1>設定</h1>
      </header>

      {/* 読み込みが終わってから入力欄を作る（保存済みの値を最初に入れるため）。
          バックアップから元に戻して中身が変わったときは、入力欄を作り直す */}
      {child !== undefined && <ChildForm key={JSON.stringify(child)} initial={child} onSaved={onClose} />}

      <h2 className="section-title">バックアップ</h2>
      <BackupSection />
    </section>
  )
}

type FormProps = {
  initial: ChildProfile | null
  onSaved: () => void
}

function ChildForm({ initial, onSaved }: FormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [birthday, setBirthday] = useState(initial?.birthday ?? '')
  const [sex, setSex] = useState<ChildProfile['sex'] | undefined>(initial?.sex)
  const [rotaType, setRotaType] = useState<ChildProfile['rotaType']>(initial?.rotaType)

  const valid = name.trim() !== '' && birthday !== '' && sex !== undefined

  const save = async () => {
    if (!sex) return
    await db.settings.put({ id: 'child', name: name.trim(), birthday, sex, rotaType })
    onSaved()
  }

  return (
    <div className="form">
      <label className="field">
        <span>名前</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="例：はなちゃん" />
      </label>

      <label className="field">
        <span>誕生日</span>
        <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
      </label>

      <div className="field">
        <span>性別（成長曲線に使います）</span>
        <div className="segmented">
          <button className={sex === 'male' ? 'choice selected' : 'choice'} onClick={() => setSex('male')}>
            男の子
          </button>
          <button className={sex === 'female' ? 'choice selected' : 'choice'} onClick={() => setSex('female')}>
            女の子
          </button>
        </div>
      </div>

      <div className="field">
        <span>ロタワクチンの種類（接種する病院で確認できます）</span>
        <div className="segmented">
          <button
            className={rotaType === 'monovalent' ? 'choice selected' : 'choice'}
            onClick={() => setRotaType('monovalent')}
          >
            1価（2回）
          </button>
          <button
            className={rotaType === 'pentavalent' ? 'choice selected' : 'choice'}
            onClick={() => setRotaType('pentavalent')}
          >
            5価（3回）
          </button>
          <button
            className={rotaType === undefined ? 'choice selected' : 'choice'}
            onClick={() => setRotaType(undefined)}
          >
            未定
          </button>
        </div>
      </div>

      <button className="primary wide" disabled={!valid} onClick={save}>
        保存
      </button>
    </div>
  )
}

export default SettingsScreen
