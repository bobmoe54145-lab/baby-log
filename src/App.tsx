import { useState } from 'react'
import HomeScreen from './screens/HomeScreen'
import SummaryScreen from './screens/SummaryScreen'
import GrowthScreen from './screens/GrowthScreen'
import VaccineScreen from './screens/VaccineScreen'
import SettingsScreen from './screens/SettingsScreen'
import './App.css'

// 画面下のタブの種類
type Tab = 'home' | 'summary' | 'growth' | 'vaccine'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'ホーム', icon: '🏠' },
  { id: 'summary', label: 'まとめ', icon: '📋' },
  { id: 'growth', label: '成長', icon: '📈' },
  { id: 'vaccine', label: '予防接種', icon: '💉' },
]

function App() {
  const [tab, setTab] = useState<Tab>('home')
  // 設定画面はタブではなく、ホームの ⚙ から開く
  const [showSettings, setShowSettings] = useState(false)

  if (showSettings) {
    return (
      <div className="app">
        <main className="content">
          <SettingsScreen onClose={() => setShowSettings(false)} />
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <main className="content">
        {tab === 'home' && (
          <HomeScreen onOpenSettings={() => setShowSettings(true)} onOpenVaccines={() => setTab('vaccine')} />
        )}
        {tab === 'summary' && <SummaryScreen />}
        {tab === 'growth' && <GrowthScreen />}
        {tab === 'vaccine' && <VaccineScreen />}
      </main>

      <nav className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={t.id === tab ? 'tab active' : 'tab'}
            onClick={() => setTab(t.id)}
          >
            <span className="tab-icon" aria-hidden="true">
              {t.icon}
            </span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

export default App
