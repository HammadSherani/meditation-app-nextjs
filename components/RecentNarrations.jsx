"use client";
import React, { useRef, useState } from 'react';

export default function RecentNarrations({ narrations = [] }) {
  const [playingId, setPlayingId] = useState(null);
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-80 bg-[#09090b] border-l border-zinc-800 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <span className="text-blue-500">📝</span>
          Recent Narrations
        </h2>
      </div>

      {/* Narrations List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        {narrations.length === 0 ? (
          <div className="flex items-center justify-center h-full text-zinc-600 text-sm p-4 text-center">
            No narrations yet. Create one to get started!
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {narrations.map((narration) => (
              <div
                key={narration._id || narration.id}
                className="bg-zinc-900/50 rounded-lg p-4 hover:bg-zinc-800/50 transition-colors cursor-pointer border border-zinc-800 hover:border-zinc-700"
              >
                {/* Play Button & Title */}
                <div className="flex items-start gap-3 mb-2">
                  <button
                    onClick={(e) => togglePlayAudio(narration.audioUrl, narration._id || narration.id, e)}
                    className="mt-0.5 bg-blue-600 hover:bg-blue-700 p-2 rounded transition-colors flex-shrink-0"
                  >
                    {playingId === (narration._id || narration.id) ? (
                      <span className="text-white text-sm">⏸</span>
                    ) : (
                      <span className="text-white text-sm">▶</span>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium line-clamp-2 leading-tight">
                      {narration.title || narration.script.substring(0, 50)}
                    </p>
                    <p className="text-zinc-500 text-xs mt-1">
                      {formatDate(narration.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Metadata */}
                <div className="ml-11 text-xs text-zinc-500 space-y-1">
                  {narration.voiceName && (
                    <p>Voice: <span className="text-zinc-300">{narration.voiceName}</span></p>
                  )}
                  {narration.mood && (
                    <p>Mood: <span className="text-blue-400 capitalize">{narration.mood}</span></p>
                  )}
                  {narration.duration && (
                    <p>Duration: <span className="text-zinc-300">{narration.duration}s</span></p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} hidden />
    </div>
  );
}
