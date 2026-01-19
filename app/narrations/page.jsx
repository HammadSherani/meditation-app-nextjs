'use client'
import { useState } from 'react'

const mockVoices = [
  { id: 1, name: 'My Custom Voice', created: '2026-01-20' },
  { id: 2, name: 'Default Male', created: '2026-01-19' },
  { id: 3, name: 'Default Female', created: '2026-01-18' },
]

const mockNarrations = [
  { id: 1, title: 'Sample Narration 1', voice: 'My Custom Voice', duration: 45, created: '2026-01-20', audioUrl: '/mock-audio1.mp3' }, // Mock URL
  { id: 2, title: 'Sample Narration 2', voice: 'Default Male', duration: 120, created: '2026-01-19', audioUrl: '/mock-audio2.mp3' },
  { id: 3, title: 'Sample Narration 3', voice: 'Default Female', duration: 90, created: '2026-01-18', audioUrl: '/mock-audio3.mp3' },
]

export default function Narrations() {
  const [activeTab, setActiveTab] = useState('narrations')

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">My Studio</h1>
        
        {/* Tabs */}
        <div className="flex mb-6">
          <button 
            onClick={() => setActiveTab('narrations')}
            className={`px-4 py-2 ${activeTab === 'narrations' ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-l`}
          >
            Narrations
          </button>
          <button 
            onClick={() => setActiveTab('voices')}
            className={`px-4 py-2 ${activeTab === 'voices' ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-r`}
          >
            Voices
          </button>
        </div>

        {/* Narrations Tab */}
        {activeTab === 'narrations' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Generated Narrations</h2>
            <div className="space-y-4">
              {mockNarrations.map(narration => (
                <div key={narration.id} className="bg-white p-4 rounded-lg shadow">
                  <h3 className="font-medium">{narration.title}</h3>
                  <p className="text-sm text-gray-600">Voice: {narration.voice} | Duration: {narration.duration}s | {narration.created}</p>
                  <audio controls className="w-full mt-2">
                    <source src={narration.audioUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Voices Tab */}
        {activeTab === 'voices' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Cloned Voices</h2>
            <div className="space-y-4">
              {mockVoices.map(voice => (
                <div key={voice.id} className="bg-white p-4 rounded-lg shadow">
                  <h3 className="font-medium">{voice.name}</h3>
                  <p className="text-sm text-gray-600">Created: {voice.created}</p>
                  <button className="mt-2 bg-blue-500 text-white px-4 py-1 rounded text-sm">Use in Narration</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}