import React, { useState, useRef, useCallback } from 'react'
import { useNarrations } from '@/lib/hooks/useNarrations'
import RecentNarrations from './RecentNarrations'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";

function OptionSection({ selectedVoice, setSelectedVoice, clonedVoices, mood, setMood, onSettingsChange, onPlayNarration }) {
  const { narrations } = useNarrations()
  const [activeTab, setActiveTab] = useState('settings')
  const [duration, setDuration] = useState(30);
  const [customDuration, setCustomDuration] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [speakerBoost, setSpeakerBoost] = useState(true);

  // Settings state — API ko dene ke liye
  const settingsRef = useRef({
    speed: 50,
    stability: 80,
    similarity: 90,
    styleExag: 0,
    speakerBoost: true,
  });

  // Label refs — re-render nahi hoga
  const speedLabelRef = useRef(null);
  const stabilityLabelRef = useRef(null);
  const similarityLabelRef = useRef(null);
  const styleExagLabelRef = useRef(null);

  // Debounce — har change pe nahi, ruk ke save karo
  const debounceTimer = useRef(null);
  const saveSettings = useCallback((newSettings) => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      console.log('Settings saved:', newSettings); // future mein yahan API call
      if (onSettingsChange) onSettingsChange(newSettings);
    }, 500);
  }, [onSettingsChange]);

  const handleRangeChange = (key, value, labelRef, getLabel) => {
    if (labelRef.current) labelRef.current.textContent = getLabel(value);
    settingsRef.current[key] = value;
    saveSettings({ ...settingsRef.current });
  };

  return (
    <div className="h-full bg-zinc-900 rounded-lg overflow-hidden flex flex-col">

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 shrink-0 gap-x-4 gap-y-2 p-2">
        <button
          onClick={() => setActiveTab('settings')}
          className={`py-2 text-sm font-medium transition-colors ${
            activeTab === 'settings'
              ? 'text-white border-b-2 border-zinc-400'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          ⚙️ Settings
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`py-2 text-sm font-medium transition-colors ${
            activeTab === 'history'
              ? 'text-white border-b-2 border-zinc-400'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          📝 History
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'history' && <RecentNarrations narrations={narrations} onPlayNarration={onPlayNarration} />}

        {activeTab === 'settings' && (
          <div className="h-full overflow-y-auto p-4 space-y-6">

            {/* Voice */}
            <div className="space-y-2">
              <label className="text-xs text-zinc-400 uppercase tracking-wider">Voice</label>
              <Select value={selectedVoice} onValueChange={(v) => { setSelectedVoice(v); saveSettings({ ...settingsRef.current, voice: v }); }}>
                <SelectTrigger className="w-full bg-zinc-800 border-zinc-700 h-10 text-white">
                  <SelectValue placeholder="Voice" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                  {clonedVoices.map(v => <SelectItem key={v.voice_id} value={v.voice_id}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Mood */}
            <div className="space-y-2">
              <label className="text-xs text-zinc-400 uppercase tracking-wider">Mood</label>
              <Select value={mood} onValueChange={(v) => { setMood(v); saveSettings({ ...settingsRef.current, mood: v }); }}>
                <SelectTrigger className="w-full bg-zinc-800 border-zinc-700 h-10 text-white">
                  <SelectValue placeholder="Select Mood" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectGroup>
                    <SelectLabel className="text-zinc-500 text-xs">Positive & Calm</SelectLabel>
                    <SelectItem value="calm">Calm</SelectItem>
                    <SelectItem value="happy">Happy</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Duration */}
            <div className="space-y-3">
              <label className="text-xs text-zinc-400 uppercase tracking-wider">Duration</label>
              <Select
                value={isCustom ? "custom" : duration.toString()}
                onValueChange={(value) => {
                  if (value === "custom") {
                    setIsCustom(true);
                    setDuration(0);
                  } else {
                    setIsCustom(false);
                    setDuration(Number(value));
                    saveSettings({ ...settingsRef.current, duration: Number(value) });
                  }
                }}
              >
                <SelectTrigger className="w-full bg-zinc-800 border-zinc-700 h-10 text-white">
                  <SelectValue placeholder="Select Duration" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectItem value="10">10 Seconds</SelectItem>
                  <SelectItem value="30">30 Seconds</SelectItem>
                  <SelectItem value="60">1 Minute</SelectItem>
                  <SelectItem value="300">5 Minutes</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>

              {isCustom && (
                <div className="space-y-2">
                  <input
                    type="number"
                    placeholder="Enter seconds (max 600)"
                    value={customDuration}
                    onChange={(e) => {
                      let value = Number(e.target.value);
                      if (value > 600) value = 600;
                      if (value < 0) value = 0;
                      setCustomDuration(value);
                      setDuration(value);
                      saveSettings({ ...settingsRef.current, duration: value });
                    }}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white"
                  />
                  <p className="text-xs text-zinc-500">Maximum allowed duration is 10 minutes (600 seconds).</p>
                </div>
              )}
            </div>

            {/* Speed */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs text-zinc-400 uppercase tracking-wider">Speed</label>
                <span ref={speedLabelRef} className="text-xs text-zinc-400">Normal</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span>Slower</span>
                <input type="range" min="0" max="100" defaultValue="50"
                  onChange={(e) => handleRangeChange('speed', Number(e.target.value), speedLabelRef,
                    v => v < 30 ? 'Slower' : v > 70 ? 'Faster' : 'Normal'
                  )}
                  className="flex-1 h-1 accent-zinc-300 cursor-pointer" />
                <span>Faster</span>
              </div>
            </div>

            {/* Stability */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs text-zinc-400 uppercase tracking-wider">Stability</label>
                <span ref={stabilityLabelRef} className="text-xs text-zinc-400">More Stable</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span>Variable</span>
                <input type="range" min="0" max="100" defaultValue="80"
                  onChange={(e) => handleRangeChange('stability', Number(e.target.value), stabilityLabelRef,
                    v => v < 30 ? 'More Variable' : v > 70 ? 'More Stable' : 'Balanced'
                  )}
                  className="flex-1 h-1 accent-zinc-300 cursor-pointer" />
                <span>Stable</span>
              </div>
            </div>

            {/* Similarity */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs text-zinc-400 uppercase tracking-wider">Similarity</label>
                <span ref={similarityLabelRef} className="text-xs text-zinc-400">High</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span>Low</span>
                <input type="range" min="0" max="100" defaultValue="90"
                  onChange={(e) => handleRangeChange('similarity', Number(e.target.value), similarityLabelRef,
                    v => v < 30 ? 'Low' : v > 70 ? 'High' : 'Medium'
                  )}
                  className="flex-1 h-1 accent-zinc-300 cursor-pointer" />
                <span>High</span>
              </div>
            </div>

            {/* Style Exaggeration */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs text-zinc-400 uppercase tracking-wider">Style Exaggeration</label>
                <span ref={styleExagLabelRef} className="text-xs text-zinc-400">None</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span>None</span>
                <input type="range" min="0" max="100" defaultValue="0"
                  onChange={(e) => handleRangeChange('styleExag', Number(e.target.value), styleExagLabelRef,
                    v => v < 10 ? 'None' : v < 50 ? 'Subtle' : 'Exaggerated'
                  )}
                  className="flex-1 h-1 accent-zinc-300 cursor-pointer" />
                <span>Exaggerated</span>
              </div>
            </div>

            {/* Speaker Boost */}
            <div className="flex items-center justify-between">
              <label className="text-xs text-zinc-400 uppercase tracking-wider">Speaker Boost</label>
              <div
                onClick={() => {
                  const newVal = !speakerBoost;
                  setSpeakerBoost(newVal);
                  settingsRef.current.speakerBoost = newVal;
                  saveSettings({ ...settingsRef.current });
                }}
                className={`relative w-10 h-5 rounded-full cursor-pointer transition-colors duration-200 ${speakerBoost ? 'bg-zinc-300' : 'bg-zinc-600'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-zinc-900 rounded-full transition-transform duration-200 ${speakerBoost ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </div>

            {/* Reset */}
            <button
              onClick={() => {
                settingsRef.current = { speed: 50, stability: 80, similarity: 90, styleExag: 0, speakerBoost: true };
                setSpeakerBoost(true);
                if (speedLabelRef.current) speedLabelRef.current.textContent = 'Normal';
                if (stabilityLabelRef.current) stabilityLabelRef.current.textContent = 'More Stable';
                if (similarityLabelRef.current) similarityLabelRef.current.textContent = 'High';
                if (styleExagLabelRef.current) styleExagLabelRef.current.textContent = 'None';
                saveSettings(settingsRef.current);
              }}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1"
            >
              ↺ Reset values
            </button>

          </div>
        )}
      </div>
    </div>
  )
}

export default OptionSection