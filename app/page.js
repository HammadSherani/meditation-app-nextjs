"use client";
import React, { useState, useEffect, useRef } from 'react';
import { toast } from "sonner";
import {
  Mic, Play, ListMusic, Plus, Volume2,
  AudioLines, Download, Trash2, AlertCircle, Square, Loader2, Sparkles
} from 'lucide-react';

// Shadcn Components
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

export default function AIStudio() {
  const [prompt, setPrompt] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [voiceName, setVoiceName] = useState("");
  const [isNoisy, setIsNoisy] = useState(false);
  
  // TTS & History States
  const [mood, setMood] = useState("");
  const [targetDuration, setTargetDuration] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [recentNarrations, setRecentNarrations] = useState([]);

  // Voice States
  const [clonedVoices, setClonedVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [playingVoice, setPlayingVoice] = useState(null);

  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const audioContext = useRef(null);
  const animationFrame = useRef(null);
  const previewAudioRef = useRef(null);

  // --- 1. Fetch Voices and History on Load ---
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

  // --- 2. Advanced TTS Generation with Validations ---
  const handleGenerateTTS = async () => {
    // Validations with Toasts
    if (!selectedVoice) {
      toast.error("Voice Missing", { description: "Please select a voice from your library." });
      return;
    }
    if (!prompt.trim()) {
      toast.error("Text Missing", { description: "Please enter a topic or script for the AI." });
      return;
    }
    if (!mood) {
      toast.error("Mood Missing", { description: "Please select a mood for the narration." });
      return;
    }
    if (!targetDuration || parseInt(targetDuration) <= 0) {
      toast.error("Duration Missing", { description: "Please specify a valid duration in seconds." });
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
        setPrompt(data.narration.script); // AI Generated Script
        setRecentNarrations(prev => [data.narration, ...prev]);
        toast.success("Narration Generated!");
        
        const audio = new Audio(data.narration.audioUrl);
        audio.play();
      } else {
        toast.error(data.error || "Generation failed");
      }
    } catch (error) {
      toast.error("Network error. Please check your connection.");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- 3. Save New Voice (Cloning) ---
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

  // --- UI Helpers ---
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];
      mediaRecorder.current.ondataavailable = (e) => audioChunks.current.push(e.data);
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: 'audio/wav' });
        setAudioUrl(URL.createObjectURL(blob));
      };
      mediaRecorder.current.start();
      setIsRecording(true);
      toast.info("Recording started...");
    } catch (err) { toast.error("Mic access denied"); }
  };

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 overflow-hidden font-sans">
      <audio ref={previewAudioRef} onEnded={() => setPlayingVoice(null)} hidden />

      {/* SIDEBAR */}
      <aside className="w-80 border-r border-zinc-800 flex flex-col bg-[#09090b]">
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-8 px-2">
            <div className="p-1.5 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20">
              <AudioLines size={20} className="text-white" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">Voice Studio</h1>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full justify-start gap-2 bg-zinc-100 text-zinc-900 hover:bg-zinc-200 rounded-xl py-6 mb-8 transition-all active:scale-95">
                <Plus size={18} /> <span className="font-semibold">Add New Voice</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-white font-sans">
              <DialogHeader><DialogTitle>Clone Your Voice</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Voice Name</Label>
                  <Input placeholder="E.g. My Podcast Voice" className="bg-zinc-900 border-zinc-800" value={voiceName} onChange={(e) => setVoiceName(e.target.value)} />
                </div>
                <div className="border-2 border-dashed border-zinc-800 rounded-xl p-8 flex flex-col items-center gap-4 bg-zinc-900/30">
                  {!audioUrl ? (
                    <Button onClick={isRecording ? () => { mediaRecorder.current?.stop(); setIsRecording(false); } : startRecording} variant={isRecording ? "destructive" : "secondary"}>
                      {isRecording ? <Square className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                      {isRecording ? "Stop Recording" : "Start Recording"}
                    </Button>
                  ) : (
                    <div className="w-full text-center space-y-2">
                      <audio src={audioUrl} controls className="w-full" />
                      <Button variant="ghost" size="sm" onClick={() => setAudioUrl(null)} className="text-zinc-500 hover:text-white">Retake Recording</Button>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleSaveVoice} disabled={!audioUrl || !voiceName}>Save to Library</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2 mb-4">Voice Library</h3>
          <ScrollArea className="flex-1">
            {isLoading ? (
               <div className="p-4 flex justify-center"><Loader2 className="animate-spin h-5 w-5 text-zinc-700" /></div>
            ) : (
              clonedVoices.map((v) => (
                <div 
                  key={v.voice_id} 
                  onClick={() => setSelectedVoice(v.voice_id)}
                  className={`flex items-center justify-between p-3 mb-1 rounded-lg cursor-pointer transition-all ${selectedVoice === v.voice_id ? 'bg-zinc-800 border-zinc-700 shadow-md' : 'hover:bg-zinc-800/50'}`}
                >
                  <div className="flex items-center gap-3">
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-zinc-900 hover:bg-blue-600 hover:text-white" onClick={(e) => togglePreview(v.voiceUrl, e)}>
                      {playingVoice === v.voiceUrl ? <Square size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                    </Button>
                    <span className={`text-sm font-medium ${selectedVoice === v.voice_id ? 'text-white' : 'text-zinc-400'}`}>{v.name}</span>
                  </div>
                </div>
              ))
            )}
          </ScrollArea>
        </div>
      </aside>

      {/* MAIN AREA */}
      <main className="flex-1 flex flex-col bg-[#0c0c0e]">
        <header className="h-20 border-b border-zinc-800 flex items-center justify-between px-8 bg-[#09090b]/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <Select value={selectedVoice} onValueChange={setSelectedVoice}>
              <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-800 h-10"><SelectValue placeholder="Voice" /></SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                {clonedVoices.map(v => <SelectItem key={v.voice_id} value={v.voice_id}>{v.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={mood} onValueChange={setMood}>
              <SelectTrigger className="w-[140px] bg-zinc-900 border-zinc-800 h-10"><SelectValue placeholder="Mood" /></SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="excited">Excited</SelectItem>
                <SelectItem value="sad">Emotional</SelectItem>
                <SelectItem value="funny">Funny</SelectItem>
                <SelectItem value="nervous">Nervous</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 h-10 rounded-md">
               <span className="text-[10px] text-zinc-500 font-bold uppercase">Sec</span>
               <input 
                type="number" 
                value={targetDuration} 
                onChange={(e) => setTargetDuration(e.target.value)}
                placeholder="30"
                className="w-10 bg-transparent text-sm focus:outline-none text-blue-400 font-bold placeholder:text-zinc-700"
               />
            </div>
          </div>

          <Button 
            onClick={handleGenerateTTS}
            disabled={isGenerating}
            className="bg-blue-600 hover:bg-blue-700 px-8 rounded-full font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
          >
            {isGenerating ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {isGenerating ? "AI Thinking..." : "Run Narration"}
          </Button>
        </header>

        <div className="flex-1 p-12 flex justify-center overflow-y-auto">
          <Textarea
            placeholder="Type your topic here (e.g. A podcast intro about tech)..."
            className="max-w-4xl min-h-[50%] bg-transparent border-none text-3xl focus-visible:ring-0 placeholder:text-zinc-800 resize-none leading-relaxed font-light"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        {/* RECENT HISTORY */}
        <div className="h-64 border-t border-zinc-800 bg-[#09090b] p-6">
          <div className="flex items-center gap-2 mb-4 px-2">
            <ListMusic size={14} className="text-blue-500" />
            <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Recent Narrations</h2>
          </div>
          <ScrollArea className="h-44">
            {recentNarrations.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-700 text-xs italic">No history yet</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentNarrations.map((item) => (
                  <Card key={item._id} className="bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 transition-colors group">
                    <CardContent className="p-4 flex items-center gap-3">
                      <Button 
                        size="icon" 
                        className="h-10 w-10 rounded-full bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white transition-all"
                        onClick={() => new Audio(item.audioUrl).play()}
                      >
                        <Play size={16} fill="currentColor" />
                      </Button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-zinc-200">{item.title || "Untitled Narration"}</p>
                        <p className="text-[10px] text-zinc-500">{item.voiceName} • {item.mood}</p>
                      </div>
                      <a href={item.audioUrl} download className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-zinc-800 rounded-md">
                        <Download size={14} className="text-zinc-500" />
                      </a>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </main>
    </div>
  );
}