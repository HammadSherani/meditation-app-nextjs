"use client";
import React, { useState, useEffect, useRef } from 'react';
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { useNarrations } from "@/lib/hooks/useNarrations";

// Components (Make sure you create these files in your components folder)
import VoiceLibrary from "@/components/VoiceLibrary";
import StudioHeader from "@/components/StudioHeader";
import RecentNarrations from "@/components/RecentNarrations";
import OptionSection from '@/components/OptionSection';
import { ChevronDown, ClosedCaption, Download, Pause, Play, RotateCcw, RotateCw, Share, ThumbsDown, ThumbsUp } from 'lucide-react';

import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';

export default function AIStudio() {
  // Redux Hook for Narrations
  const { narrations, addNarration } = useNarrations();

  // State Management
  const [prompt, setPrompt] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [voiceName, setVoiceName] = useState("");
  const [mood, setMood] = useState("");
  const [targetDuration, setTargetDuration] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [clonedVoices, setClonedVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [playingVoice, setPlayingVoice] = useState(null);
  const [isCheckingNoise, setIsCheckingNoise] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [narationdata, setNarrationData] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const { data: session } = useSession();
  const router = useRouter();

  // Settings from OptionSection
  const settingsRef = useRef({
    speed: 50,
    stability: 80,
    similarity: 90,
    styleExag: 0,
    speakerBoost: true,
    duration: 30,
  });
  



  const audioRef = useRef(null);
  const bgMusicRef = useRef(null);

  // Refs
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const previewAudioRef = useRef(null);


  




  // Initial Data Fetching (Voices only - Narrations are handled by Redux)
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const voiceRes = await fetch("/api/get-voices");
        const voiceData = await voiceRes.json();
        if (voiceData.success) {
          setClonedVoices(voiceData.voices);
          if (voiceData.voices.length > 0) setSelectedVoice(voiceData.voices[0].voice_id);
        }
      } catch (error) {
        console.error("Fetch error:", error);
        toast.error("Failed to load voices");
      } finally {
        setIsLoading(false);
      }
    };
    fetchVoices();
  }, []);

  // --- Functions ---

  // 1. Noise Detection & Recording Start
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Ambient Noise Check Logic
      setIsCheckingNoise(true);
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // 1.5 seconds check for noise
      setTimeout(() => {
        analyser.getByteFrequencyData(dataArray);
        const averageNoise = dataArray.reduce((a, b) => a + b) / bufferLength;

        // Threshold: 35dB roughly maps to 40-50 in raw byte data
        if (averageNoise > 45) {
          toast.error("Environment too noisy!", {
            description: "Please find a quieter place (Target < 35dB)."
          });
          stream.getTracks().forEach(track => track.stop());
          setIsCheckingNoise(false);
          return;
        }

        // Noise is fine, start actual recording
        setIsCheckingNoise(false);
        mediaRecorder.current = new MediaRecorder(stream);
        audioChunks.current = [];
        mediaRecorder.current.ondataavailable = (e) => audioChunks.current.push(e.data);
        mediaRecorder.current.onstop = () => {
          const blob = new Blob(audioChunks.current, { type: 'audio/wav' });
          setAudioUrl(URL.createObjectURL(blob));
        };
        mediaRecorder.current.start();
        setIsRecording(true);
        toast.info("Quiet enough! Recording started...");
      }, 1500);

    } catch (err) {
      toast.error("Mic access denied");
      setIsCheckingNoise(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  // 2. Clone Voice API Call
  const handleSaveVoice = async () => {
    if (!audioUrl || !voiceName) {
      toast.warning("Incomplete Data", { description: "Record audio and provide a name." });
      return;
    }
    try {
      const audioBlob = await fetch(audioUrl).then(r => r.blob());
      const formData = new FormData();
      formData.append("name", voiceName);
      formData.append("file", audioBlob);
      formData.append("duration", "10");

      const response = await fetch("/api/clone-voice", { method: "POST", body: formData });
      const result = await response.json();
      if (result.success) {
        setClonedVoices((prev) => [result.voice, ...prev]);
        setSelectedVoice(result.voice.voice_id);
        setAudioUrl(null);
        setVoiceName("");
        toast.success("Voice successfully cloned!");
      }
    } catch (error) { toast.error("Error cloning voice"); }
  };

  // Callback to receive settings from OptionSection
  const handleSettingsChange = (newSettings) => {
    settingsRef.current = { ...settingsRef.current, ...newSettings };
  };

  // 3. Generate Narration (TTS)
  const handleGenerateTTS = async () => {
    const currentSettings = settingsRef.current;
    const currentDuration = currentSettings.duration || targetDuration;

    if (!selectedVoice || !prompt.trim()) {
      toast.error("Missing Fields", { description: "Please select a voice and enter a prompt." });
      return;
    }

    setIsGenerating(true);
    const vName = clonedVoices.find(v => v.voice_id === selectedVoice)?.name || "AI Voice";

    try {
      const response = await fetch("/api/generate-tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceId: selectedVoice,
          voiceName: vName,
          userText: prompt,
          duration: currentDuration,
          mood: mood || "neutral",
          settings: {
            speed: currentSettings.speed,
            stability: currentSettings.stability,
            similarity: currentSettings.similarity,
            styleExag: currentSettings.styleExag,
            speakerBoost: currentSettings.speakerBoost,
            duration: currentDuration,
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        // setPrompt(data.narration.script);
        addNarration(data.narration);
        setIsPlayingPreview(true);
        setNarrationData(data.narration);
        toast.success("Narration Generated!");
        // const audio = new Audio(data.narration.audioUrl);
        // audio.play();
      } else {
        toast.error(data.error || "Generation failed");
      }
    } catch (error) {
      toast.error("Network error.");
    } finally {
      setIsGenerating(false);
    }
  };

  // 4. Preview Voice List Audio
  const togglePreview = (url, e) => {
    e.stopPropagation();
    if (playingVoice === url) {
      previewAudioRef.current.pause();
      setPlayingVoice(null);
    } else {
      setPlayingVoice(url);
      previewAudioRef.current.src = url;
      previewAudioRef.current.play();
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      if (bgMusicRef.current) bgMusicRef.current.pause();
    } else {
      audioRef.current.play();
      if (bgMusicRef.current) bgMusicRef.current.play();
    }

    setIsPlaying(!isPlaying);
  };


  const formatTime = (time) => {
    if (!time) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

useEffect(() => {
    if (!narationdata?.audioUrl) return;

    // Purana audio stop
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
    }

    setCurrentTime(0);
    setDuration(0);

    const audio = new Audio(narationdata.audioUrl);
    audioRef.current = audio;

    audio.addEventListener("loadedmetadata", () => setDuration(audio.duration));
    audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime));

    audio.addEventListener("ended", () => {
        setIsPlaying(false);
    });

    audio.play().catch(e => console.log('Auto-play blocked:', e));
    setIsPlaying(true);

    return () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    };
}, [narationdata]);

  useEffect(() => {
    if(!session) {
      // toast.error("You must be logged in to access the studio.");
      // alert("You must be logged in to access the studio.");
      router.push("/login");
    }
  },[])

  // console.log("narationdata", narationdata);


  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 overflow-hidden font-sans">
      {/* Hidden Global Audio for previews */}
      <audio ref={previewAudioRef} onEnded={() => setPlayingVoice(null)} hidden />

      <VoiceLibrary
        clonedVoices={clonedVoices}
        selectedVoice={selectedVoice}
        setSelectedVoice={setSelectedVoice}
        isLoading={isLoading}
        playingVoice={playingVoice}
        togglePreview={togglePreview}
        voiceName={voiceName}
        setVoiceName={setVoiceName}
        isRecording={isRecording}
        isCheckingNoise={isCheckingNoise}
        audioUrl={audioUrl}
        setAudioUrl={setAudioUrl}
        startRecording={startRecording}
        stopRecording={stopRecording}
        handleSaveVoice={handleSaveVoice}
      />

      <main className="flex-1 flex flex-col bg-[#0c0c0e] relative">
        <StudioHeader
          selectedVoice={selectedVoice}
          setSelectedVoice={setSelectedVoice}
          clonedVoices={clonedVoices}
          mood={mood}
          setMood={setMood}
          targetDuration={targetDuration}
          setTargetDuration={setTargetDuration}
          handleGenerateTTS={handleGenerateTTS}
          isGenerating={isGenerating}
        />

        <div className="flex-1 p-3 flex justify-center overflow-hidden">
          <div className='grid grid-cols-3 gap-2 w-full'>
            <div className="col-span-2  p-4 rounded-lg flex flex-col overflow-hidden relative">
              <Textarea
                placeholder="Type your topic here (e.g. A podcast intro about tech)..."
                className="flex-1 w-full bg-transparent border-none text-3xl focus-visible:ring-0 placeholder:text-zinc-800 resize-none leading-relaxed font-light"
                value={prompt}
                onChange={(e) => {
                  if (e.target.value.length <= 5000) {
                    setPrompt(e.target.value);
                  }
                }}
              />


              <div className={`absolute bottom-2 left-0 bg-zinc-900/40 w-full pt-4 ${isPlayingPreview ? "pb-32" : "pb-10"} px-3 rounded-sm`}>
                <div className='flex items-center justify-end gap-4 text-white'>
                  <div className=' flex'>
                    {prompt.length.toLocaleString()} / 5,000 Characters
                  </div>
                  <button
                    onClick={handleGenerateTTS}
                    disabled={isGenerating || !selectedVoice}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
                  >
                    {isGenerating ? "Generating..." : "Generate Speech"}
                  </button>
                </div>
              </div>
            </div>

            <OptionSection 
               selectedVoice={selectedVoice}
          setSelectedVoice={setSelectedVoice}
          clonedVoices={clonedVoices}
          mood={mood}
          setMood={setMood}
          onSettingsChange={handleSettingsChange}
             />

          </div>
        </div>


       {isPlayingPreview && narationdata && (
  <div className="absolute bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 px-6 py-4 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
    <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-6">

      {/* Left — Info */}
      <div className="flex flex-col min-w-0 flex-1">
        <h3 className="text-white font-medium truncate text-sm">
          {narationdata?.title?.substring(0, 60) || "Narration"}...
        </h3>
        <p className="text-xs text-zinc-500 mt-0.5">
          <span className="text-zinc-400">{narationdata?.voiceName}</span>
          <span className="mx-1.5">•</span>
          {narationdata?.mood}
          <span className="mx-1.5">•</span>
          🎵 {narationdata?.bgMusicCategory?.replace('_', ' ')}
        </p>
      </div>

      {/* Center — Controls */}
      <div className="flex flex-col items-center flex-[2] max-w-2xl w-full gap-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (!audioRef.current) return;
              audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
              setCurrentTime(audioRef.current.currentTime);
            }}
            className="w-9 h-9 rounded-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-all flex items-center justify-center"
            title="Back 10s"
          >
            <RotateCcw size={16} />
          </button>

          <button
            onClick={togglePlay}
            className="w-11 h-11 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-all"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
          </button>

          <button
            onClick={() => {
              if (!audioRef.current || !duration) return;
              audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10);
              setCurrentTime(audioRef.current.currentTime);
            }}
            className="w-9 h-9 rounded-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-all flex items-center justify-center"
            title="Forward 10s"
          >
            <RotateCw size={16} />
          </button>
        </div>

        {/* ⭐ Seekable progress bar */}
        <div className="w-full flex items-center gap-3">
          <span className="text-[11px] text-zinc-500 w-8 text-right">{formatTime(currentTime)}</span>
          <div
            className="relative flex-1 h-1.5 bg-zinc-700 rounded-full cursor-pointer"
            onClick={(e) => {
              if (!audioRef.current || !duration) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const percent = (e.clientX - rect.left) / rect.width;
              const newTime = percent * duration;
              audioRef.current.currentTime = newTime;
              setCurrentTime(newTime);
            }}
          >
            <div
              className="absolute top-0 left-0 h-full bg-white rounded-full transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[11px] text-zinc-500 w-8">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right — Actions */}
      <div className="flex items-center gap-3 flex-1 justify-end">
        {/* Download */}
        <a
          href={narationdata?.audioUrl}
          download="narration.mp3"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-all"
          title="Download"
        >
          <Download size={19} strokeWidth={1.5} />
        </a>

        {/* Close */}
        <button
          onClick={() => {
            if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
            if (bgMusicRef.current) { bgMusicRef.current.pause(); bgMusicRef.current = null; }
            setIsPlaying(false);
            setIsPlayingPreview(false);
            setCurrentTime(0);
            setDuration(0);
          }}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-all"
          title="Close"
        >
          ✕
        </button>
      </div>

    </div>
  </div>
)}


      </main>

      {/* Right Sidebar - Recent Narrations */}

    </div>
  );
}