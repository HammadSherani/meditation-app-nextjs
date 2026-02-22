"use client";
import React, { useRef, useState } from 'react';

export default function RecentNarrations({ narrations = [] }) {
  const [playingId, setPlayingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  const [downloadingId, setDownloadingId] = useState(null);
  const audioRef = useRef(null);

  const togglePlayAudio = (url, id, e) => {
    e.stopPropagation();
    if (playingId === id) {
      audioRef.current.pause();
      setPlayingId(null);
    } else {
      setPlayingId(id);
      audioRef.current.src = url;
      audioRef.current.play();
    }
  };

  const handleDownload = async (audioUrl, title, id, e) => {
    e.stopPropagation();
    setDownloadingId(id);
    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileName = (title || 'narration').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      a.download = `${fileName}.mp3`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const toggleFilter = (filter) => {
    setActiveFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    );
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffHrs >= 24) {
      const diffDays = Math.floor(diffHrs / 24);
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
    if (diffHrs > 0) return `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`;
    if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    return 'just now';
  };

  const isToday = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    return (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  };

  const filteredNarrations = narrations.filter((n) => {
    const query = searchQuery.toLowerCase();
    const title = (n.title || n.script || '').toLowerCase();
    return title.includes(query);
  });

  const todayNarrations = filteredNarrations.filter((n) => isToday(n.createdAt));
  const olderNarrations = filteredNarrations.filter((n) => !isToday(n.createdAt));

  const filters = ['Voice', 'Model', 'Date'];

  const NarrationItem = ({ narration }) => {
    const id = narration._id || narration.id;
    const isPlaying = playingId === id;
    const isDownloading = downloadingId === id;
    const title = narration.title || narration.script?.substring(0, 80) || 'Untitled';
    const voiceName = narration.voiceName || 'Unknown Voice';
    const mood = narration.mood || '';

    return (
      <div className="py-4 border-b border-zinc-800 last:border-b-0 cursor-pointer hover:bg-zinc-800/20 px-4 -mx-4 transition-colors group">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 flex-shrink-0">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5" fill="none"/>
                <ellipse cx="12" cy="12" rx="4" ry="10" stroke="white" strokeWidth="1.5" fill="none"/>
                <line x1="2" y1="12" x2="22" y2="12" stroke="white" strokeWidth="1.5"/>
              </svg>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-zinc-100 text-sm font-normal line-clamp-1 leading-snug">
              {title}
            </p>
            <p className="text-zinc-500 text-xs mt-0.5">
              {voiceName}
              {mood ? ` · ${mood}` : ''}
              {' · '}
              {formatTimeAgo(narration.createdAt)}
            </p>
          </div>

          <div className="flex items-center gap-0.5 flex-shrink-0 ml-1">

            <button
              onClick={(e) => handleDownload(narration.audioUrl, narration.title, id, e)}
              disabled={isDownloading}
              title="Download audio"
              className="text-zinc-600 hover:text-blue-400 transition-all opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDownloading ? (
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2"
                  className="animate-spin text-blue-400"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              )}
            </button>

            <button
              onClick={(e) => togglePlayAudio(narration.audioUrl, id, e)}
              title={isPlaying ? 'Pause' : 'Play'}
              className="text-zinc-500 hover:text-zinc-200 transition-colors p-1.5 rounded-md hover:bg-zinc-800"
            >
              {isPlaying ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1"/>
                  <rect x="14" y="4" width="4" height="16" rx="1"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5,3 19,12 5,21"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-[#09090b] border-l border-zinc-800 flex flex-col overflow-hidden h-full">
      <div className="p-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-full px-4 py-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500 flex-shrink-0">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-zinc-300 text-sm placeholder-zinc-600 outline-none flex-1 w-full"
            />
          </div>
          {/* List icon */}
          {/* <button className="text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </button> */}
        </div>

        {/* Filter Chips */}
        {/* <div className="flex gap-2 mt-3">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => toggleFilter(filter)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs border transition-colors ${
                activeFilters.includes(filter)
                  ? 'bg-zinc-700 border-zinc-500 text-zinc-100'
                  : 'bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'
              }`}
            >
              {!activeFilters.includes(filter) && (
                <span className="text-zinc-500">+</span>
              )}
              {filter}
            </button>
          ))}
        </div> */}
      </div>

      {/* Narrations List */}
      <div
        className="thin-scroll flex-1 overflow-y-auto px-4"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#3f3f46 transparent' }}
      >
        {filteredNarrations.length === 0 ? (
          <div className="flex items-center justify-center h-full text-zinc-600 text-sm p-4 text-center">
            No narrations yet. Create one to get started!
          </div>
        ) : (
          <>
            {todayNarrations.length > 0 && (
              <div>
                <div className="flex justify-center my-4">
                  <span className="text-zinc-400 text-xs bg-zinc-800 px-3 py-1 rounded-full">Today</span>
                </div>
                {todayNarrations.map((narration) => (
                  <NarrationItem key={narration._id || narration.id} narration={narration} />
                ))}
              </div>
            )}

            {olderNarrations.length > 0 && (
              <div>
                <div className="flex justify-center my-4">
                  <span className="text-zinc-400 text-xs bg-zinc-800 px-3 py-1 rounded-full">Earlier</span>
                </div>
                {olderNarrations.map((narration) => (
                  <NarrationItem key={narration._id || narration.id} narration={narration} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} hidden />
    </div>
  );
}