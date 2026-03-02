import React, { useState } from 'react'
import { useNarrations } from '@/lib/hooks/useNarrations'
import RecentNarrations from './RecentNarrations'

function OptionSection() {
  const { narrations } = useNarrations()
  const [activeTab, setActiveTab] = useState('settings')

  return (
    <div className="h-full bg-zinc-900 rounded-lg overflow-hidden flex flex-col">
      
      {/* Tabs */}
      <div className="flex border-b border-zinc-800 shrink-0 gap-x-4 gap-y-2 p-2">
         <button
          onClick={() => setActiveTab('settings')}
          className={` py-2 text-sm font-medium transition-colors ${
            activeTab === 'settings'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          ⚙️ Settings
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={` py-2 text-sm font-medium transition-colors ${
            activeTab === 'history'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          📝 History
        </button>
       
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'history' && (
          <RecentNarrations narrations={narrations} />
        )}
        {activeTab === 'settings' && (
          <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
            Settings coming soon...
          </div>
        )}
      </div>

    </div>
  )
}

export default OptionSection