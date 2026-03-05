"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  Search,
  Music,
  Check,
  RotateCcw,
  RotateCw,
  Volume2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

// Animated waveform bars for playing state
function WaveformBars({ isPlaying }) {
  return (
    <span className="inline-flex items-end gap-[2px] h-4">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className={`inline-block w-[3px] rounded-full bg-blue-400 transition-all ${
            isPlaying ? "animate-pulse" : ""
          }`}
          style={{
            height: isPlaying ? `${[10, 16, 12, 8][i]}px` : "6px",
            animationDelay: `${i * 80}ms`,
            animationDuration: `${600 + i * 120}ms`,
            transition: "height 0.3s ease",
          }}
        />
      ))}
    </span>
  );
}

// Timeline / waveform visualization for active track
function TrackTimeline({
  progress,
  currentTime,
  duration,
  onSeek,
  trackId,
  playingTrackId,
  onSeekBackward,
  onSeekForward,
}) {
  const isActive = playingTrackId === trackId;

  const formatTime = (t) => {
    if (!t || isNaN(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Fake waveform shape (decorative bars)
  const waveHeights = [
    3, 6, 10, 14, 9, 5, 12, 16, 11, 7, 4, 8, 13, 15, 10, 6, 3, 9, 14, 12,
    7, 5, 11, 16, 8, 4, 6, 13, 10, 9, 5, 12, 15, 11, 7, 3, 8, 14, 10, 6,
    4, 9, 13, 16, 11, 7, 5, 12, 8, 3,
  ];

  return (
    <div className="mt-3 space-y-2">
      {/* Waveform timeline */}
      <div
        className="relative w-full h-10 cursor-pointer group"
        onClick={(e) => {
          if (!isActive) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = (e.clientX - rect.left) / rect.width;
          onSeek(pct);
        }}
      >
        {/* Waveform bars */}
        <div className="absolute inset-0 flex items-center gap-[2px] overflow-hidden">
          {waveHeights.map((h, i) => {
            const barPct = ((i + 0.5) / waveHeights.length) * 100;
            const filled = isActive && barPct <= progress;
            return (
              <div
                key={i}
                className="flex-1 rounded-full transition-colors duration-150"
                style={{
                  height: `${h}px`,
                  backgroundColor: filled
                    ? "#3b82f6"
                    : isActive
                    ? "rgba(255,255,255,0.12)"
                    : "rgba(255,255,255,0.07)",
                }}
              />
            );
          })}
        </div>

        {/* Playhead */}
        {isActive && (
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-blue-400 rounded-full shadow-[0_0_6px_#3b82f6] pointer-events-none transition-all duration-100"
            style={{ left: `calc(${progress}% - 1px)` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-400 rounded-full shadow-[0_0_8px_#3b82f6]" />
          </div>
        )}
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onSeekBackward(e); }}
          className="flex items-center justify-center w-6 h-6 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <RotateCcw size={11} />
        </button>

        {/* Time labels */}
        <div className="flex-1 flex justify-between text-[10px] font-mono text-zinc-500">
          <span className="text-blue-400">{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onSeekForward(e); }}
          className="flex items-center justify-center w-6 h-6 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <RotateCw size={11} />
        </button>
      </div>
    </div>
  );
}

export default function BackgroundMusicModal({
  open,
  onOpenChange,
  onSelectMusic,
  currentSpeechUrl,
}) {
  const [tracks, setTracks] = useState([]);
  const [filteredTracks, setFilteredTracks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [playingTrackId, setPlayingTrackId] = useState(null);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [previewDuration, setPreviewDuration] = useState(0);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
  const [isApplying, setIsApplying] = useState(false);

  const previewAudioRef = useRef(null);
  const progressIntervalRef = useRef(null);

  useEffect(() => {
    if (open) fetchTracks();
  }, [open]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTracks(tracks);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredTracks(
        tracks.filter(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q)
        )
      );
    }
  }, [searchQuery, tracks]);

  useEffect(() => {
    if (!open) {
      stopPreview();
      setSelectedTrack(null);
      setSearchQuery("");
    }
  }, [open]);

  const fetchTracks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/get-bg-music");
      const data = await res.json();
      if (data.success) {
        setTracks(data.tracks);
        setFilteredTracks(data.tracks);
      } else {
        toast.error("Failed to load music tracks");
      }
    } catch (error) {
      toast.error("Error fetching music tracks");
    } finally {
      setLoading(false);
    }
  };

  const stopPreview = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
    }
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    setPlayingTrackId(null);
    setPreviewProgress(0);
    setPreviewCurrentTime(0);
    setPreviewDuration(0);
  };

  const togglePreview = (track) => {
    if (playingTrackId === track.id) {
      previewAudioRef.current?.pause();
      setPlayingTrackId(null);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    } else {
      stopPreview();
      const audio = new Audio(track.url);
      previewAudioRef.current = audio;

      audio.addEventListener("loadedmetadata", () => setPreviewDuration(audio.duration));
      audio.addEventListener("ended", () => {
        setPlayingTrackId(null);
        setPreviewProgress(0);
        setPreviewCurrentTime(0);
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      });

      audio.play().catch(() => toast.error("Failed to play track"));
      setPlayingTrackId(track.id);

      progressIntervalRef.current = setInterval(() => {
        if (audio && !audio.paused) {
          setPreviewCurrentTime(audio.currentTime);
          setPreviewProgress((audio.currentTime / audio.duration) * 100);
        }
      }, 100);
    }
  };

  const seekPreview = (e, forward = true) => {
    e.stopPropagation();
    if (previewAudioRef.current && playingTrackId) {
      const amt = 5;
      previewAudioRef.current.currentTime = forward
        ? Math.min(previewAudioRef.current.duration, previewAudioRef.current.currentTime + amt)
        : Math.max(0, previewAudioRef.current.currentTime - amt);
    }
  };

  const handleSeekByPercent = (pct) => {
    if (previewAudioRef.current) {
      const newTime = pct * previewAudioRef.current.duration;
      previewAudioRef.current.currentTime = newTime;
      setPreviewCurrentTime(newTime);
      setPreviewProgress(pct * 100);
    }
  };

  const handleSelectTrack = (track) => {
    setSelectedTrack(track.id === selectedTrack?.id ? null : track);
  };

  const handleApplyMusic = async () => {
    if (!selectedTrack) { toast.warning("Please select a track first"); return; }
    setIsApplying(true);
    stopPreview();
    try {
      onSelectMusic({ track: selectedTrack, speechUrl: currentSpeechUrl });
      toast.success("Background music added!");
      onOpenChange(false);
    } catch {
      toast.error("Failed to apply background music");
    } finally {
      setIsApplying(false);
    }
  };

  // Category color map
  const categoryColors = {
    Ambient: "bg-violet-500/20 text-violet-300 border border-violet-500/30",
    Jazz: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
    Classical: "bg-rose-500/20 text-rose-300 border border-rose-500/30",
    Electronic: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30",
    Nature: "bg-green-500/20 text-green-300 border border-green-500/30",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="border-0 text-white p-0 sm:max-w-[680px] max-h-[88vh] overflow-hidden flex flex-col rounded-2xl"
        style={{
          background: "linear-gradient(145deg, #0f1117 0%, #13151f 50%, #0f1117 100%)",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.07), 0 32px 80px rgba(0,0,0,0.7), 0 0 60px rgba(59,130,246,0.06)",
        }}
      >
        {/* Top accent line */}
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)",
                boxShadow: "0 4px 16px rgba(59,130,246,0.35)",
              }}
            >
              <Music className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-[17px] font-semibold tracking-tight text-white">
                Background Music
              </h2>
              <p className="text-[13px] text-zinc-500 mt-0.5 leading-relaxed">
                Preview and select a track — it plays softly behind your speech
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <Input
              placeholder="Search by name or mood..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 text-sm rounded-xl border-0 text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-blue-500/50"
              style={{
                background: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(8px)",
              }}
            />
          </div>
        </div>

        {/* Count badge */}
        {!loading && (
          <div className="px-6 pb-2 flex items-center gap-2">
            <span className="text-[11px] text-zinc-600 uppercase tracking-widest font-medium">
              {filteredTracks.length} track{filteredTracks.length !== 1 ? "s" : ""}
            </span>
            <div className="flex-1 h-[1px] bg-white/5" />
          </div>
        )}

        {/* Track List */}
        <ScrollArea className="flex-1 px-6 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border border-blue-500/20 animate-pulse" />
                <Loader2 className="w-5 h-5 animate-spin text-blue-500 absolute inset-0 m-auto" />
              </div>
              <p className="text-xs text-zinc-600">Loading tracks...</p>
            </div>
          ) : filteredTracks.length === 0 ? (
            <div className="text-center py-16">
              <Music className="w-10 h-10 mx-auto mb-3 text-zinc-700" />
              <p className="text-sm text-zinc-600">No tracks found</p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {filteredTracks.map((track) => {
                const isPlaying = playingTrackId === track.id;
                const isSelected = selectedTrack?.id === track.id;
                const catClass =
                  categoryColors[track.category] ||
                  "bg-zinc-700/40 text-zinc-400 border border-zinc-700/50";

                return (
                  <div
                    key={track.id}
                    onClick={() => handleSelectTrack(track)}
                    className="relative rounded-xl cursor-pointer transition-all duration-200 overflow-hidden"
                    style={{
                      background: isSelected
                        ? "linear-gradient(135deg, rgba(37,99,235,0.18) 0%, rgba(124,58,237,0.10) 100%)"
                        : isPlaying
                        ? "rgba(59,130,246,0.07)"
                        : "rgba(255,255,255,0.03)",
                      border: isSelected
                        ? "1px solid rgba(59,130,246,0.4)"
                        : isPlaying
                        ? "1px solid rgba(59,130,246,0.2)"
                        : "1px solid rgba(255,255,255,0.05)",
                      boxShadow: isSelected
                        ? "0 0 0 1px rgba(59,130,246,0.15) inset, 0 4px 20px rgba(59,130,246,0.08)"
                        : "none",
                    }}
                  >
                    <div className="p-3.5">
                      <div className="flex items-center gap-3">
                        {/* Play button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePreview(track);
                          }}
                          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-200"
                          style={{
                            background: isPlaying
                              ? "linear-gradient(135deg, #2563eb, #7c3aed)"
                              : "rgba(255,255,255,0.07)",
                            boxShadow: isPlaying
                              ? "0 0 16px rgba(59,130,246,0.5)"
                              : "none",
                            border: isPlaying
                              ? "1px solid rgba(99,102,241,0.4)"
                              : "1px solid rgba(255,255,255,0.08)",
                          }}
                        >
                          {isPlaying ? (
                            <Pause size={14} className="text-white" />
                          ) : (
                            <Play size={14} className="text-zinc-300 ml-0.5" />
                          )}
                        </button>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[13px] font-medium text-white truncate">
                              {track.name}
                            </span>
                            {isPlaying && (
                              <WaveformBars isPlaying={true} />
                            )}
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${catClass}`}
                            >
                              {track.category}
                            </span>
                          </div>

                          {/* Timeline — shown when playing */}
                          {isPlaying && (
                            <TrackTimeline
                              progress={previewProgress}
                              currentTime={previewCurrentTime}
                              duration={previewDuration}
                              onSeek={handleSeekByPercent}
                              trackId={track.id}
                              playingTrackId={playingTrackId}
                              onSeekBackward={(e) => seekPreview(e, false)}
                              onSeekForward={(e) => seekPreview(e, true)}
                            />
                          )}
                        </div>

                        {/* Selection circle */}
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-200"
                          style={{
                            background: isSelected
                              ? "linear-gradient(135deg, #2563eb, #7c3aed)"
                              : "transparent",
                            border: isSelected
                              ? "none"
                              : "1.5px solid rgba(255,255,255,0.15)",
                            boxShadow: isSelected
                              ? "0 0 10px rgba(59,130,246,0.5)"
                              : "none",
                          }}
                        >
                          {isSelected && (
                            <Check size={11} className="text-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{
            background: "rgba(0,0,0,0.3)",
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: "rgba(59,130,246,0.15)" }}
            >
              <Volume2 size={12} className="text-blue-400" />
            </div>
            <span className="text-[12px] text-zinc-500">
              Plays at low volume behind speech
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-[13px] font-medium text-zinc-400 hover:text-white rounded-lg transition-colors"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              Cancel
            </button>
            <button
              onClick={handleApplyMusic}
              disabled={!selectedTrack || isApplying}
              className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-white rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background:
                  selectedTrack && !isApplying
                    ? "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)"
                    : "rgba(59,130,246,0.3)",
                boxShadow:
                  selectedTrack && !isApplying
                    ? "0 4px 16px rgba(59,130,246,0.35)"
                    : "none",
              }}
            >
              {isApplying ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <Music className="w-3.5 h-3.5" />
                  Apply Music
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}