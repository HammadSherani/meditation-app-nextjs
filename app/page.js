"use client";
import React, { useState, useEffect, useRef } from 'react';
import {
  Mic, Play, ListMusic, Plus, Volume2,
  AudioLines, Download, Trash2, AlertCircle, Square, Loader2
} from 'lucide-react';

// Shadcn Components
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle } from "@/components/ui/alert";

export default function AIStudio() {
  const [prompt, setPrompt] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [voiceName, setVoiceName] = useState("");
  const [isNoisy, setIsNoisy] = useState(false);
  
  // Dynamic Data States
  const [clonedVoices, setClonedVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [playingVoice, setPlayingVoice] = useState(null); // Preview control

  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const audioContext = useRef(null);
  const animationFrame = useRef(null);
  const previewAudioRef = useRef(null);

  // --- 1. Fetch Voices from MongoDB on Load ---
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const response = await fetch("/api/get-voices");
        const data = await response.json();
        if (data.success) {
          setClonedVoices(data.voices);
          if (data.voices.length > 0) setSelectedVoice(data.voices[0].voice_id);
        }
      } catch (error) {
        console.error("Error fetching voices:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVoices();
  }, []);

  // --- 2. Preview Player Logic ---
  const togglePreview = (url, e) => {
    e.stopPropagation(); // Card selection ko rokne ke liye
    if (playingVoice === url) {
      previewAudioRef.current.pause();
      setPlayingVoice(null);
    } else {
      setPlayingVoice(url);
      previewAudioRef.current.src = url;
      previewAudioRef.current.play();
    }
  };

  // --- 3. Save Voice Logic (ElevenLabs + Cloudinary + MongoDB) ---
  const handleSaveVoice = async () => {
    if (!audioUrl || !voiceName) {
      alert("Please record audio and enter a voice name.");
      return;
    }

    try {
      const audio = new Audio(audioUrl);
      const getDuration = new Promise((resolve) => {
        audio.addEventListener('loadedmetadata', () => resolve(audio.duration));
      });
      const duration = await getDuration;

      const audioBlob = await fetch(audioUrl).then(r => r.blob());
      const formData = new FormData();
      formData.append("name", voiceName);
      formData.append("file", audioBlob);
      formData.append("duration", duration.toFixed(2));
      formData.append("fileSize", audioBlob.size);

      const response = await fetch("/api/clone-voice", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setClonedVoices((prev) => [result.voice, ...prev]);
        setSelectedVoice(result.voice.voice_id);
        setAudioUrl(null);
        setVoiceName("");
        alert("Voice Cloned and Saved to MongoDB & Cloudinary!");
      } else {
        alert("Error: " + result.error);
      }
    } catch (error) {
      alert("Something went wrong!");
    }
  };

  // --- 4. Recording Logic ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.current.createMediaStreamSource(stream);
      const analyser = audioContext.current.createAnalyser();
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const check = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setIsNoisy(avg > 35);
        animationFrame.current = requestAnimationFrame(check);
      };
      check();

      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];
      mediaRecorder.current.ondataavailable = (e) => audioChunks.current.push(e.data);
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: 'audio/wav' });
        setAudioUrl(URL.createObjectURL(blob));
        cancelAnimationFrame(animationFrame.current);
      };
      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err) { alert("Mic access denied"); }
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setIsRecording(false);
  };

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 overflow-hidden font-sans">
      
      {/* Hidden Audio for Preview */}
      <audio ref={previewAudioRef} onEnded={() => setPlayingVoice(null)} hidden />

      {/* --- SIDEBAR --- */}
      <aside className="w-80 border-r border-zinc-800 flex flex-col bg-[#09090b]">
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-8 px-2">
            <div className="p-1.5 bg-blue-600 rounded-lg"><AudioLines size={20} className="text-white" /></div>
            <h1 className="text-lg font-bold">Voice Studio</h1>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full justify-start gap-2 bg-zinc-100 text-zinc-900 hover:bg-zinc-200 rounded-xl py-6 mb-8">
                <Plus size={18} /> <span className="font-semibold">Add New Voice</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
              <DialogHeader><DialogTitle>Add a New Voice</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Voice Name</Label>
                  <Input 
                    placeholder="E.g. Professional Male" 
                    className="bg-zinc-900 border-zinc-800" 
                    value={voiceName} 
                    onChange={(e) => setVoiceName(e.target.value)} 
                  />
                </div>
                {isRecording && isNoisy && (
                  <Alert variant="destructive" className="bg-red-900/20 border-red-900">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Too much background noise!</AlertTitle>
                  </Alert>
                )}
                <div className="border-2 border-dashed border-zinc-800 rounded-xl p-8 flex flex-col items-center gap-4 bg-zinc-900/30">
                  {!audioUrl ? (
                    <Button onClick={isRecording ? stopRecording : startRecording} variant={isRecording ? "destructive" : "secondary"}>
                      {isRecording ? <Square className="mr-2 h-4 w-4 fill-current" /> : <Mic className="mr-2 h-4 w-4" />}
                      {isRecording ? "Stop Recording" : "Start Recording"}
                    </Button>
                  ) : (
                    <div className="w-full text-center space-y-2">
                      <audio src={audioUrl} controls className="w-full" />
                      <Button variant="ghost" size="sm" onClick={() => setAudioUrl(null)} className="text-zinc-500">Retake Recording</Button>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700" 
                  onClick={handleSaveVoice} 
                  disabled={!audioUrl || isNoisy || !voiceName}
                >
                  Save to Library
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2 mb-4">Your Voice Library</h3>
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex items-center gap-2 p-2 text-zinc-600 text-xs"><Loader2 className="animate-spin h-3 w-3" /> Loading...</div>
            ) : (
              clonedVoices.map((v) => (
                <div 
                  key={v.voice_id} 
                  onClick={() => setSelectedVoice(v.voice_id)}
                  className={`flex items-center justify-between p-3 mb-1 rounded-lg cursor-pointer group transition-all ${selectedVoice === v.voice_id ? 'bg-zinc-800 border border-zinc-700' : 'hover:bg-zinc-800/50'}`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 rounded-full bg-zinc-900 hover:bg-blue-600 hover:text-white"
                      onClick={(e) => togglePreview(v.voiceUrl, e)}
                    >
                      {playingVoice === v.voiceUrl ? <Square size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" className="ml-0.5" />}
                    </Button>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium truncate">{v.name}</span>
                      <span className="text-[10px] text-zinc-500">{v.metadata?.duration}s sample</span>
                    </div>
                  </div>
                  {selectedVoice === v.voice_id && (
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                  )}
                </div>
              ))
            )}
          </ScrollArea>
        </div>
      </aside>

      {/* --- MAIN AREA --- */}
      <main className="flex-1 flex flex-col bg-[#0c0c0e]">
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-8 bg-[#09090b]">
          <div className="flex items-center gap-4">
            <Select value={selectedVoice} onValueChange={setSelectedVoice}>
              <SelectTrigger className="w-[240px] bg-zinc-900 border-zinc-800 focus:ring-0">
                <SelectValue placeholder="Select a voice" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                {clonedVoices.map(v => (
                  <SelectItem key={v.voice_id} value={v.voice_id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 px-8 rounded-full font-semibold transition-all hover:scale-105">
            Run Narration
          </Button>
        </header>

        <div className="flex-1 p-12 flex justify-center">
          <Textarea
            placeholder="Type or paste your script here..."
            className="max-w-4xl min-h-full bg-transparent border-none text-2xl focus-visible:ring-0 placeholder:text-zinc-800 resize-none leading-relaxed font-light"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>
      </main>
    </div>
  );
}