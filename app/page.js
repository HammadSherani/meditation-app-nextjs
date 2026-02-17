"use client";
import React, { useState, useEffect, useRef } from 'react';
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

// Components (Make sure you create these files in your components folder)
import VoiceLibrary from "@/components/VoiceLibrary";
import StudioHeader from "@/components/StudioHeader";
import RecentNarrations from "@/components/RecentNarrations";
import OptionSection from '@/components/OptionSection';

export default function AIStudio() {
  // State Management
  const [prompt, setPrompt] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [voiceName, setVoiceName] = useState("");
  const [mood, setMood] = useState("");
  const [targetDuration, setTargetDuration] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [recentNarrations, setRecentNarrations] = useState([]);
  const [clonedVoices, setClonedVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [playingVoice, setPlayingVoice] = useState(null);
  const [isCheckingNoise, setIsCheckingNoise] = useState(false);

  // Refs
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const previewAudioRef = useRef(null);




  // Initial Data Fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [voiceRes, narrationRes] = await Promise.all([
          fetch("/api/get-voices"),
          fetch("/api/get-narrations")
        ]);

        const voiceData = await voiceRes.json();
        if (voiceData.success) {
          setClonedVoices(voiceData.voices);
          if (voiceData.voices.length > 0) setSelectedVoice(voiceData.voices[0].voice_id);
        }

        const narrationData = await narrationRes.json();
        if (narrationData.success) setRecentNarrations(narrationData.narrations);

      } catch (error) {
        console.error("Fetch error:", error);
        toast.error("Failed to load initial data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
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
        setPrompt(data.narration.script);
        setRecentNarrations(prev => [data.narration, ...prev]);
        toast.success("Narration Generated!");
        const audio = new Audio(data.narration.audioUrl);
        audio.play();
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

      <main className="flex-1 flex flex-col bg-[#0c0c0e]">
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
            <div className="col-span-2 bg-blue-600/20 p-4 rounded-lg flex flex-col">
              <Textarea
                placeholder="Type your topic here (e.g. A podcast intro about tech)..."
                className="flex-1 w-full bg-transparent border-none text-3xl focus-visible:ring-0 placeholder:text-zinc-800 resize-none leading-relaxed font-light"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <OptionSection />

          </div>
        </div>
      </main>

      {/* Right Sidebar - Recent Narrations */}

    </div>
  );
}