import {
  Mic,
  Plus,
  AudioLines,
  Square,
  Play,
  Loader2,
  CheckCircle2,
  Music,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from 'react';

export default function VoiceLibrary({
  clonedVoices,
  selectedVoice,
  setSelectedVoice,
  isLoading,
  playingVoice,
  togglePreview,
  voiceName,
  setVoiceName,
  isRecording,
  isCheckingNoise,
  audioUrl,
  setAudioUrl,
  startRecording,
  stopRecording,
  handleSaveVoice,
}) {
  const [activeTab, setActiveTab] = useState("text-to-speech");
  const [backgroundMusicOpen, setBackgroundMusicOpen] = useState(false);
  const [selectedBgMusic, setSelectedBgMusic] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Background music options (you can fetch these from API later)
  const backgroundMusics = [
    { id: 1, name: "Ambient Meditation", url: "#" },
    { id: 2, name: "Forest Rain", url: "#" },
    { id: 3, name: "Ocean Waves", url: "#" },
    { id: 4, name: "Piano Soft", url: "#" },
    { id: 5, name: "Nature Sounds", url: "#" },
  ];

  return (
    <aside
      className={`
        border-r border-zinc-800 flex flex-col bg-[#09090b]
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-72'}
      `}
    >
      <div className="relative flex flex-col h-full">
        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`
            absolute -right-3 top-6 z-20
            bg-zinc-900 border border-zinc-700 rounded-full p-1.5
            hover:bg-zinc-800 transition-colors shadow-md
          `}
        >
          {isCollapsed ? (
            <ChevronRight size={16} className="text-zinc-300" />
          ) : (
            <ChevronLeft size={16} className="text-zinc-300" />
          )}
        </button>

        <div className="p-4 flex flex-col h-full">
          {/* Header */}
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2'} mb-8`}>
            <div className="p-1.5 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20 flex-shrink-0">
              <AudioLines size={20} className="text-white" />
            </div>

            {!isCollapsed && (
              <h1 className="text-lg font-bold tracking-tight">Voice Studio</h1>
            )}
          </div>

          {/* Tabs */}
          {!isCollapsed ? (
            // <div className="flex gap-2 mb-8 bg-zinc-900 p-1 rounded-lg">
            //   <button
            //     onClick={() => setActiveTab("voice")}
            //     className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-all ${activeTab === "voice"
            //       ? "bg-blue-600 text-white"
            //       : "text-zinc-400 hover:text-white"
            //       }`}
            //   >
            //     Voice
            //   </button>
            //   <button
            //     onClick={() => setActiveTab("music")}
            //     className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-all ${activeTab === "music"
            //       ? "bg-blue-600 text-white"
            //       : "text-zinc-400 hover:text-white"
            //       }`}
            //   >
            //     Music
            //   </button>
            // </div>
            <>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 mb-8">
              <button
                onClick={() => setActiveTab("voice")}
                className={`p-3 rounded-lg transition-colors ${activeTab === "voice" ? "bg-blue-600" : "hover:bg-zinc-800"
                  }`}
              >
                <Mic size={20} />
              </button>
              <button
                onClick={() => setActiveTab("music")}
                className={`p-3 rounded-lg transition-colors ${activeTab === "music" ? "bg-blue-600" : "hover:bg-zinc-800"
                  }`}
              >
                <Music size={20} />
              </button>
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "voice" && (
              <>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      className={`
                        w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200
                        rounded-xl transition-all active:scale-95 mb-8
                        ${isCollapsed ? 'p-3 min-h-[52px] justify-center' : 'justify-start gap-2 py-6'}
                      `}
                    >
                      <Plus size={18} />
                      {!isCollapsed && <span className="font-semibold">Add New Voice</span>}
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
                    <DialogHeader>
                      <DialogTitle>Clone Your Voice</DialogTitle>
                    </DialogHeader>
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
                                <>
                                  <Square className="mr-2 h-4 w-4" /> Stop Recording
                                </>
                              ) : isCheckingNoise ? (
                                "Analyzing..."
                              ) : (
                                <>
                                  <Mic className="mr-2 h-4 w-4" /> Start Recording
                                </>
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

                {!isCollapsed && (
                  <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2 mb-4">
                    Your Voices
                  </h3>
                )}

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
                        className={`
                          flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}
                          p-3 mb-1 rounded-lg cursor-pointer transition-all
                          ${selectedVoice === v.voice_id
                            ? 'bg-zinc-800 border-zinc-700 shadow-md'
                            : 'hover:bg-zinc-800/50'}
                        `}
                      >
                        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-full bg-zinc-900 hover:bg-blue-600 hover:text-white flex-shrink-0"
                            onClick={(e) => togglePreview(v.voiceUrl, e)}
                          >
                            {playingVoice === v.voiceUrl ? (
                              <Square size={12} fill="currentColor" />
                            ) : (
                              <Play size={12} fill="currentColor" />
                            )}
                          </Button>

                          {!isCollapsed && (
                            <span
                              className={`text-sm font-medium ${selectedVoice === v.voice_id ? 'text-white' : 'text-zinc-400'
                                }`}
                            >
                              {v.name}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </ScrollArea>


              </>
            )}

            {activeTab === "music" && (
              <>
                {!isCollapsed && (
                  <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2 mb-4">
                    Background Music
                  </h3>
                )}

                <div className="space-y-2">
                  <button
                    onClick={() => setBackgroundMusicOpen(!backgroundMusicOpen)}
                    className={`
                      w-full flex items-center justify-between
                      p-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg
                      text-white transition-all
                      ${isCollapsed ? 'justify-center p-3' : ''}
                    `}
                  >
                    {!isCollapsed ? (
                      <>
                        <div className="flex items-center gap-2">
                          <Music size={16} />
                          <span className="font-medium text-sm">
                            {selectedBgMusic
                              ? backgroundMusics.find((m) => m.id === selectedBgMusic)?.name
                              : "Select background music"}
                          </span>
                        </div>
                        <ChevronDown
                          size={16}
                          className={`transition-transform ${backgroundMusicOpen ? 'rotate-180' : ''}`}
                        />
                      </>
                    ) : (
                      <Music size={20} />
                    )}
                  </button>

                  {backgroundMusicOpen && !isCollapsed && (
                    <div className="space-y-1 p-2 bg-zinc-900 border border-zinc-800 rounded-lg">
                      {backgroundMusics.map((music) => (
                        <button
                          key={music.id}
                          onClick={() => {
                            setSelectedBgMusic(music.id);
                            setBackgroundMusicOpen(false);
                          }}
                          className={`w-full text-left flex items-center gap-3 p-3 rounded-lg transition-all ${selectedBgMusic === music.id
                            ? 'bg-blue-600 text-white'
                            : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                            }`}
                        >
                          <Music size={14} />
                          <span className="text-sm">{music.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedBgMusic && !isCollapsed && (
                    <div className="mt-4 p-4 bg-zinc-900 rounded-lg border border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-400">Now Selected</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedBgMusic(null);
                            setBackgroundMusicOpen(false);
                          }}
                          className="text-xs text-zinc-500 hover:text-white h-auto p-0"
                        >
                          Clear
                        </Button>
                      </div>
                      <p className="text-sm font-medium text-white">
                        {backgroundMusics.find((m) => m.id === selectedBgMusic)?.name}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}


            {activeTab === "text-to-speech" && (
              <>
                {isCollapsed ? (
                  <div className="flex justify-center">
                    <div className="p-3 bg-blue-600 rounded-lg">
                      <Mic size={20} className="text-white" />
                    </div>
                  </div>
                ) : (
                  <p className="flex items-center bg-gray-900 gap-2 border border-blue-800 text-white px-4 py-2 rounded-sm capitalize">
                    <Mic size={20} className="text-white" />
                    text to speech
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}