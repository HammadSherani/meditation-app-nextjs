'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const mockVoices = [
  { id: 1, name: 'My Custom Voice', created: '2026-01-20' },
  { id: 2, name: 'Default Male', created: '2026-01-19' },
  { id: 3, name: 'Default Female', created: '2026-01-18' },
]

export default function SelectVoice() {
  const [selectedVoice, setSelectedVoice] = useState(mockVoices[0])
  const [mode, setMode] = useState('narrative')
  const [duration, setDuration] = useState(60)
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const router = useRouter()

  const handleGenerate = (e) => {
    e.preventDefault()
    setIsGenerating(true)
    // Mock delay
    setTimeout(() => {
      setIsGenerating(false)
      router.push('/narrations')
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">Select Voice & Generate Narration</h1>
        
        {/* Voice Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Select Voice</label>
          <select 
            value={selectedVoice.id} 
            onChange={(e) => setSelectedVoice(mockVoices.find(v => v.id === parseInt(e.target.value)))}
            className="w-full p-2 border rounded"
          >
            {mockVoices.map(voice => (
              <option key={voice.id} value={voice.id}>{voice.name} ({voice.created})</option>
            ))}
          </select>
        </div>

        {/* Mode */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Mode</label>
          <select value={mode} onChange={(e) => setMode(e.target.value)} className="w-full p-2 border rounded">
            <option value="narrative">Narrative</option>
            <option value="conversational">Conversational</option>
            <option value="dramatic">Dramatic</option>
          </select>
        </div>

        {/* Duration */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Duration (seconds)</label>
          <input 
            type="number" 
            value={duration} 
            onChange={(e) => setDuration(parseInt(e.target.value))} 
            min={10} max={300}
            className="w-full p-2 border rounded" 
          />
        </div>

        {/* Prompt */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Prompt</label>
          <textarea 
            value={prompt} 
            onChange={(e) => setPrompt(e.target.value)} 
            placeholder="Write your narration script here..."
            rows={4}
            className="w-full p-2 border rounded" 
            required
          />
        </div>

        <button 
          onClick={handleGenerate} 
          disabled={isGenerating || !prompt}
          className="w-full bg-green-500 text-white py-2 rounded disabled:opacity-50"
        >
          {isGenerating ? 'Generating...' : 'Generate Narration'}
        </button>
      </div>
    </div>
  )
}