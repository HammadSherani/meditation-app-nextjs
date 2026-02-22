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

  const audioRef = useRef(null);

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

  // 3. Generate Narration (TTS)
  const handleGenerateTTS = async () => {
    if (!selectedVoice || !prompt.trim() || !mood || !targetDuration) {
      toast.error("Missing Fields", { description: "Please check voice, prompt, mood and duration." });
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
          duration: targetDuration,
          mood: mood
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
    } else {
      audioRef.current.play();
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
    if (narationdata?.audioUrl) {
      const audio = new Audio(narationdata.audioUrl);
      audioRef.current = audio;
      setIsPlaying(true);
      audio.play();

      audio.addEventListener("loadedmetadata", () => {
        setDuration(audio.duration);
      });

      audio.addEventListener("timeupdate", () => {
        setCurrentTime(audio.currentTime);
      });

      audio.addEventListener("ended", () => {
        setIsPlaying(false);
      });
    }
  }, [narationdata]);


  console.log("narationdata", narationdata);


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

            <OptionSection />

          </div>
        </div>


        {isPlayingPreview && (
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-8">

              <div className="flex flex-col min-w-0 flex-1 group">
                <h3 className="text-gray-900 font-medium truncate text-[17px] tracking-tight">
                  {narationdata?.title || "Every small effort, every small step bring..."}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex-shrink-0" />
                  <p className="text-[13px] text-gray-500 truncate">
                    <span className="font-medium text-gray-600">{narationdata?.voiceName || "Chris"}</span>
                    <span className="mx-1.5">•</span>
                    {narationdata?.mood || "Charming"}
                    <span className="mx-1.5">•</span>
                    Created {new Date(narationdata?.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center flex-[1.5] max-w-2xl w-full">
                <div className="flex items-center gap-8 mb-2">
                  <button className="relative text-gray-500 hover:text-black transition-colors">
                    <RotateCcw size={22} strokeWidth={1.5} />
                    <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold mt-1">10</span>
                  </button>

                  <button
                    onClick={togglePlay}
                    className="w-11 h-11 bg-black rounded-full flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all shadow-md"
                  >
                    {isPlaying ? (
                      <Pause size={20} />
                    ) : (
                      <Play size={20} fill="currentColor" className="ml-0.5" />
                    )}
                  </button>

                  <button className="relative text-gray-500 hover:text-black transition-colors">
                    <RotateCw size={22} strokeWidth={1.5} />
                    <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold mt-1">10</span>
                  </button>
                </div>

                <div className="w-full flex items-center gap-3 group">
                  <span className="text-[11px] font-medium text-gray-400 w-8 text-right">
                    {formatTime(currentTime)}
                  </span>
                  <div className="relative flex-1 h-1.5 bg-gray-100 rounded-full cursor-pointer overflow-hidden">
                    <div className="absolute top-0 left-0 h-full bg-gray-300 rounded-full transition-all"
                      style={{ width: `${progress}%` }}>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-gray-400 w-8">
                    {formatTime(duration)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-5 flex-1 justify-end">
                {/* <div className="flex items-center gap-1 border-r border-gray-100 pr-4 mr-1">
                  <button className="p-2 text-gray-500 hover:bg-gray-50 rounded-full transition-colors">
                    <ThumbsUp size={19} strokeWidth={1.5} />
                  </button>
                  <button className="p-2 text-gray-500 hover:bg-gray-50 rounded-full transition-colors">
                    <ThumbsDown size={19} strokeWidth={1.5} />
                  </button>
                </div> */}

                {/* <button className="flex items-center gap-2 px-5 py-2 border border-gray-200 rounded-full text-[14px] font-semibold text-gray-700 hover:bg-gray-50 transition-all active:bg-gray-100">
                  <Share size={18} strokeWidth={2} />
                  Share
                </button> */}

                <button className="p-2 text-gray-500 hover:text-black hover:bg-gray-50 rounded-full transition-all">
                  <Download size={21} strokeWidth={1.5} />
                </button>

                <button className="p-1.5 text-gray-400 hover:text-black transition-colors">
                  <ClosedCaption size={22} />
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