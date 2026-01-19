"use client";
import React, { useState, useRef } from 'react';
import { 
  Mic, Play, ListMusic, Settings, Plus, Volume2, 
  Clock, AudioLines, Download, Trash2, AlertCircle, Save, Square 
} from 'lucide-react';

// Shadcn Components
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AIStudio() {
  const [prompt, setPrompt] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [voiceName, setVoiceName] = useState("");
  const [isNoisy, setIsNoisy] = useState(false);

  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const audioContext = useRef(null);
  const animationFrame = useRef(null);

  // --- Mock Data ---
  const [clonedVoices, setClonedVoices] = useState([
    { id: 1, name: "Premium Male", type: "Pro" },
    { id: 2, name: "Soft Storyteller", type: "Pro" },
  ]);

  const narrations = [
    { id: 1, title: "Ad Script V1", voice: "Premium Male", duration: "0:45" },
    { id: 2, title: "Intro Audio", voice: "Soft Storyteller", duration: "1:12" },
  ];

  // --- Noise & Recording Logic ---
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
        setIsNoisy(avg > 35); // Noise threshold
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
    mediaRecorder.current.stop();
    setIsRecording(false);
  };

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 overflow-hidden font-sans">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-72 border-r border-zinc-800 flex flex-col bg-[#09090b]">
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-8 px-2">
            <div className="p-1.5 bg-blue-600 rounded-lg"><AudioLines size={20} className="text-white" /></div>
            <h1 className="text-lg font-bold">Voice Studio</h1>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full justify-start gap-2 bg-zinc-100 text-zinc-900 hover:bg-zinc-200 rounded-xl py-6 mb-8">
                <Plus size={18} /> <span className="font-semibold">Clone New Voice</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
              <DialogHeader><DialogTitle>Clone a New Voice</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Voice Name</Label>
                  <Input placeholder="Enter name" className="bg-zinc-900 border-zinc-800" value={voiceName} onChange={(e)=>setVoiceName(e.target.value)} />
                </div>
                {isRecording && isNoisy && (
                  <Alert variant="destructive" className="bg-red-900/20 border-red-900">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Too much noise!</AlertTitle>
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
                      <Button variant="ghost" size="sm" onClick={() => setAudioUrl(null)} className="text-zinc-500">Retake</Button>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button className="w-full bg-blue-600" disabled={!audioUrl || isNoisy}>Save Voice</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2 mb-4">Your Library</h3>
          <ScrollArea className="flex-1">
            {clonedVoices.map((v) => (
              <div key={v.id} className="flex items-center justify-between p-3 mb-1 hover:bg-zinc-800/50 rounded-lg cursor-pointer group">
                <div className="flex items-center gap-3">
                  <Volume2 size={16} className="text-zinc-500 group-hover:text-blue-400" />
                  <span className="text-sm font-medium">{v.name}</span>
                </div>
                <Badge variant="outline" className="text-[9px] border-zinc-700">{v.type}</Badge>
              </div>
            ))}
          </ScrollArea>
        </div>
      </aside>

      {/* --- MAIN AREA --- */}
      <main className="flex-1 flex flex-col bg-[#0c0c0e]">
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-8 bg-[#09090b]">
          <div className="flex items-center gap-4">
            <Select defaultValue="v1">
              <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-800"><SelectValue placeholder="Voice" /></SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                <SelectItem value="v1">Premium Male</SelectItem>
                <SelectItem value="v2">Soft Storyteller</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="narr">
              <SelectTrigger className="w-[140px] bg-zinc-900 border-zinc-800"><SelectValue placeholder="Mode" /></SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                <SelectItem value="narr">Narration</SelectItem>
                <SelectItem value="promo">Promo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 px-8 rounded-full">Run Narration</Button>
        </header>

        <div className="flex-1 p-8 flex justify-center">
          <Textarea 
            placeholder="Write your script here..." 
            className="max-w-4xl min-h-full bg-transparent border-none text-2xl focus-visible:ring-0 placeholder:text-zinc-800 resize-none leading-relaxed"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        {/* --- NARRATION HISTORY --- */}
        <footer className="h-72 border-t border-zinc-800 bg-[#09090b] p-6">
          <div className="flex items-center gap-2 mb-4 px-2">
            <ListMusic size={18} className="text-blue-500" />
            <h2 className="text-sm font-semibold">Recent Narrations</h2>
          </div>
          <ScrollArea className="h-44">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {narrations.map((item) => (
                <Card key={item.id} className="bg-zinc-900/40 border-zinc-800 group transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Button size="icon" className="h-10 w-10 rounded-full bg-blue-600/10 text-blue-500 border border-blue-500/20"><Play size={16} fill="currentColor"/></Button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-[11px] text-zinc-500">{item.voice} • {item.duration}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500"><Download size={14}/></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500/50"><Trash2 size={14}/></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </footer>
      </main>
    </div>
  );
}