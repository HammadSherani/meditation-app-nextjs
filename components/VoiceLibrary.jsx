import { Mic, Plus, AudioLines, Square, Play, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function VoiceLibrary({ 
  clonedVoices, selectedVoice, setSelectedVoice, isLoading, 
  playingVoice, togglePreview, voiceName, setVoiceName, 
  isRecording, isCheckingNoise, audioUrl, setAudioUrl, 
  startRecording, stopRecording, handleSaveVoice 
}) {
  return (
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
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
            <DialogHeader><DialogTitle>Clone Your Voice</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Voice Name</Label>
                <Input 
                  placeholder="E.g. My Podcast Voice" 
                  className="bg-zinc-900 border-zinc-800" 
                  value={voiceName} 
                  onChange={(e) => setVoiceName(e.target.value)} 
                />
              </div>

              <div className="border-2 border-dashed border-zinc-800 rounded-xl p-8 flex flex-col items-center gap-4 bg-zinc-900/30">
                {!audioUrl ? (
                  <div className="flex flex-col items-center gap-3">
                    {/* Noise Analysis State UI */}
                    {isCheckingNoise && (
                      <div className="flex items-center gap-2 text-blue-400 text-sm animate-pulse mb-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Checking environment noise...
                      </div>
                    )}

                    <Button 
                      onClick={isRecording ? stopRecording : startRecording} 
                      variant={isRecording ? "destructive" : "secondary"}
                      disabled={isCheckingNoise}
                      className="min-w-[160px]"
                    >
                      {isRecording ? (
                        <><Square className="mr-2 h-4 w-4" /> Stop Recording</>
                      ) : isCheckingNoise ? (
                        "Analyzing..."
                      ) : (
                        <><Mic className="mr-2 h-4 w-4" /> Start Recording</>
                      )}
                    </Button>

                    <p className="text-[10px] text-zinc-500 text-center px-4">
                      Tip: Keep your environment quiet (Target &lt; 35dB) for best results.
                    </p>
                  </div>
                ) : (
                  <div className="w-full text-center space-y-3">
                    <div className="flex items-center justify-center gap-2 text-green-500 text-xs mb-1">
                      <CheckCircle2 size={14} /> Clear Recording Captured
                    </div>
                    <audio src={audioUrl} controls className="w-full h-10" />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setAudioUrl(null)} 
                      className="text-zinc-500 hover:text-white"
                    >
                      Retake Recording
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700" 
                onClick={handleSaveVoice} 
                disabled={!audioUrl || !voiceName}
              >
                Save to Library
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2 mb-4">Voice Library</h3>
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="p-4 flex justify-center">
              <Loader2 className="animate-spin h-5 w-5 text-zinc-700" />
            </div>
          ) : (
            clonedVoices.map((v) => (
              <div
                key={v.voice_id}
                onClick={() => setSelectedVoice(v.voice_id)}
                className={`flex items-center justify-between p-3 mb-1 rounded-lg cursor-pointer transition-all ${
                  selectedVoice === v.voice_id ? 'bg-zinc-800 border-zinc-700 shadow-md' : 'hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 rounded-full bg-zinc-900 hover:bg-blue-600 hover:text-white" 
                    onClick={(e) => togglePreview(v.voiceUrl, e)}
                  >
                    {playingVoice === v.voiceUrl ? (
                      <Square size={12} fill="currentColor" />
                    ) : (
                      <Play size={12} fill="currentColor" />
                    )}
                  </Button>
                  <span className={`text-sm font-medium ${selectedVoice === v.voice_id ? 'text-white' : 'text-zinc-400'}`}>
                    {v.name}
                  </span>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </div>
    </aside>
  );
}