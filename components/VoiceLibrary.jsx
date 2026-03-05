import {
  Mic,
  Plus,
  AudioLines,
  Square,
  Play,
  Loader2,
  CheckCircle2,
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className="border-r  border-zinc-800 flex flex-col bg-[#0f0f0f] transition-all duration-300 ease-in-out flex-shrink-0"
      style={{ width: isCollapsed ? 64 : 288 }}
    >
      <div className="relative  p-3 flex flex-col h-full overflow-hidden">

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute  -right-2 top-6 z-50 w-6 h-6 rounded-full flex items-center justify-center bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 transition-colors shadow-md"
        >
          {isCollapsed
            ? <ChevronRight size={13} className="text-zinc-300" />
            : <ChevronLeft size={13} className="text-zinc-300" />}
        </button>

        <div className="flex flex-col h-full overflow-hidden">

          {/* Header */}
          <div className={`flex items-center mb-6 flex-shrink-0 ${isCollapsed ? 'justify-center' : 'gap-2'}`}>
            <div className="p-1.5 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20 flex-shrink-0">
              <AudioLines size={20} className="text-white" />
            </div>
            {!isCollapsed && (
              <h1 className="text-base font-bold tracking-tight text-white whitespace-nowrap overflow-hidden">
                Voice Studio
              </h1>
            )}
          </div>

          {/* Tabs */}
          <div className={`flex-shrink-0 mb-6 ${isCollapsed ? 'flex flex-col items-center gap-2' : ''}`}>
            {isCollapsed ? (
              // Collapsed: stacked icon buttons
              <>
                <button
                  onClick={() => setActiveTab("text-to-speech")}
                  title="Text to Speech"
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    activeTab === "text-to-speech"
                      ? "bg-blue-600 text-white"
                      : "text-zinc-500 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  <Mic size={18} />
                </button>
                <button
                  onClick={() => setActiveTab("voice")}
                  title="Voice Library"
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    activeTab === "voice"
                      ? "bg-blue-600 text-white"
                      : "text-zinc-500 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  <AudioLines size={18} />
                </button>
              </>
            ) : (
              // Expanded: pill switcher
              <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab("text-to-speech")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                    activeTab === "text-to-speech"
                      ? "bg-blue-600 text-white shadow"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Mic size={12} />
                  Text to Speech
                </button>
                <button
                  onClick={() => setActiveTab("voice")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                    activeTab === "voice"
                      ? "bg-blue-600 text-white shadow"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <AudioLines size={12} />
                  Voices
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">

            {/* ── TEXT TO SPEECH TAB ── */}
            {activeTab === "text-to-speech" && (
              <div className="flex-1">
                {isCollapsed ? (
                  <div className="flex justify-center">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Mic size={18} className="text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 px-3 py-3 rounded-lg border border-blue-800/60 bg-blue-950/30">
                    <Mic size={16} className="text-blue-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white capitalize">Text to Speech</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Generate speech from text</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── VOICE LIBRARY TAB ── */}
            {activeTab === "voice" && (
              <div className="flex-1 overflow-hidden flex flex-col gap-3 min-h-0">

                {/* Add New Voice */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      className={`
                        bg-zinc-100 text-zinc-900 hover:bg-zinc-200
                        rounded-xl transition-all active:scale-95 flex-shrink-0
                        ${isCollapsed
                          ? 'w-10 h-10 p-0 mx-auto'
                          : 'w-full justify-start gap-2 py-5'
                        }
                      `}
                    >
                      <Plus size={18} className="flex-shrink-0" />
                      {!isCollapsed && <span className="font-semibold text-sm">Add New Voice</span>}
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

                {/* Section label */}
                {!isCollapsed && (
                  <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1 flex-shrink-0">
                    Your Voices
                  </h3>
                )}

                {/* Voice list */}
                {!isCollapsed && (
                <ScrollArea className="flex-1 min-h-0">
                  {isLoading ? (
                    <div className="p-4 flex justify-center">
                      <Loader2 className="animate-spin h-5 w-5 text-zinc-700" />
                    </div>
                  ) : clonedVoices.length === 0 ? (
                    !isCollapsed && (
                      <div className="text-center py-8">
                        <Mic size={22} className="mx-auto mb-2 text-zinc-800" />
                        <p className="text-[11px] text-zinc-700">No voices yet</p>
                      </div>
                    )
                  ) : (
                    <div className="space-y-1 pr-1">
                      {clonedVoices.map((v) => (
                        <div
                          key={v.voice_id}
                          onClick={() => setSelectedVoice(v.voice_id)}
                          className={`
                            flex items-center p-2.5 rounded-lg cursor-pointer transition-all
                            ${isCollapsed ? 'justify-center' : 'gap-3'}
                            ${selectedVoice === v.voice_id
                              ? 'bg-zinc-800 border border-zinc-700 shadow-md'
                              : 'hover:bg-zinc-800/50 border border-transparent'
                            }
                          `}
                        >
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
                            <span className={`text-sm font-medium truncate ${
                              selectedVoice === v.voice_id ? 'text-white' : 'text-zinc-400'
                            }`}>
                              {v.name}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </aside>
  );
}


// import {
//   Mic,
//   Plus,
//   AudioLines,
//   Square,
//   Play,
//   Loader2,
//   CheckCircle2,
//   ChevronDown,
//   ChevronLeft,
//   ChevronRight,
// } from 'lucide-react';
// import { Button } from "@/components/ui/button";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { useState } from 'react';

// export default function VoiceLibrary({
//   clonedVoices,
//   selectedVoice,
//   setSelectedVoice,
//   isLoading,
//   playingVoice,
//   togglePreview,
//   voiceName,
//   setVoiceName,
//   isRecording,
//   isCheckingNoise,
//   audioUrl,
//   setAudioUrl,
//   startRecording,
//   stopRecording,
//   handleSaveVoice,
// }) {
//   const [activeTab, setActiveTab] = useState("text-to-speech");
//   const [backgroundMusicOpen, setBackgroundMusicOpen] = useState(false);
//   const [selectedBgMusic, setSelectedBgMusic] = useState(null);
//   const [isCollapsed, setIsCollapsed] = useState(false);

 

//   return (
//     <aside
//       className={`
//         border-r border-zinc-800 flex flex-col bg-[#09090b]
//         transition-all duration-300 ease-in-out
//         ${isCollapsed ? 'w-16' : 'w-72'}
//       `}
//     >
//       <div className="relative flex flex-col h-full">
//         {/* Collapse Toggle Button */}
//         <button
//           onClick={() => setIsCollapsed(!isCollapsed)}
//           className={`
//             absolute -right-3 top-6 z-20
//             bg-zinc-900 border border-zinc-700 rounded-full p-1.5
//             hover:bg-zinc-800 transition-colors shadow-md
//           `}
//         >
//           {isCollapsed ? (
//             <ChevronRight size={16} className="text-zinc-300" />
//           ) : (
//             <ChevronLeft size={16} className="text-zinc-300" />
//           )}
//         </button>

//         <div className="p-4 flex flex-col h-full">
//           {/* Header */}
//           <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2'} mb-8`}>
//             <div className="p-1.5 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20 flex-shrink-0">
//               <AudioLines size={20} className="text-white" />
//             </div>

//             {!isCollapsed && (
//               <h1 className="text-lg font-bold tracking-tight">Voice Studio</h1>
//             )}
//           </div>

//           {/* Tabs */}
//           {!isCollapsed ? (
//             // <div className="flex gap-2 mb-8 bg-zinc-900 p-1 rounded-lg">
//             //   <button
//             //     onClick={() => setActiveTab("voice")}
//             //     className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-all ${activeTab === "voice"
//             //       ? "bg-blue-600 text-white"
//             //       : "text-zinc-400 hover:text-white"
//             //       }`}
//             //   >
//             //     Voice
//             //   </button>
            
//             // </div>
//             <>
//             </>
//           ) : (
//             <div className="flex flex-col items-center gap-3 mb-8">
//               <button
//                 onClick={() => setActiveTab("voice")}
//                 className={`p-3 rounded-lg transition-colors rounded-lg ${activeTab === "voice" ? "bg-blue-600" : "hover:bg-zinc-800"
//                   }`}
//               >
//                 <Mic size={20} />
//               </button>
             
//             </div>
//           )}

//           {/* Content Area */}
//           <div className="flex-1 overflow-hidden">
//             {activeTab === "voice" && (
//               <>
//                 <Dialog>
//                   <DialogTrigger asChild>
//                     <Button
//                       className={`
//                         w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200
//                         rounded-xl transition-all active:scale-95 mb-8
//                         ${isCollapsed ? 'p-3 min-h-[52px] justify-center' : 'justify-start gap-2 py-6'}
//                       `}
//                     >
//                       <Plus size={18} />
//                       {!isCollapsed && <span className="font-semibold">Add New Voice</span>}
//                     </Button>
//                   </DialogTrigger>

//                   <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
//                     <DialogHeader>
//                       <DialogTitle>Clone Your Voice</DialogTitle>
//                     </DialogHeader>
//                     <div className="space-y-4 py-4">
//                       <div className="space-y-2">
//                         <Label>Voice Name</Label>
//                         <Input
//                           placeholder="E.g. My Podcast Voice"
//                           className="bg-zinc-900 border-zinc-800"
//                           value={voiceName}
//                           onChange={(e) => setVoiceName(e.target.value)}
//                         />
//                       </div>

//                       <div className="border-2 border-dashed border-zinc-800 rounded-xl p-8 flex flex-col items-center gap-4 bg-zinc-900/30">
//                         {!audioUrl ? (
//                           <div className="flex flex-col items-center gap-3">
//                             {isCheckingNoise && (
//                               <div className="flex items-center gap-2 text-blue-400 text-sm animate-pulse mb-2">
//                                 <Loader2 className="h-4 w-4 animate-spin" />
//                                 Checking environment noise...
//                               </div>
//                             )}

//                             <Button
//                               onClick={isRecording ? stopRecording : startRecording}
//                               variant={isRecording ? "destructive" : "secondary"}
//                               disabled={isCheckingNoise}
//                               className="min-w-[160px]"
//                             >
//                               {isRecording ? (
//                                 <>
//                                   <Square className="mr-2 h-4 w-4" /> Stop Recording
//                                 </>
//                               ) : isCheckingNoise ? (
//                                 "Analyzing..."
//                               ) : (
//                                 <>
//                                   <Mic className="mr-2 h-4 w-4" /> Start Recording
//                                 </>
//                               )}
//                             </Button>

//                             <p className="text-[10px] text-zinc-500 text-center px-4">
//                               Tip: Keep your environment quiet (Target &lt; 35dB) for best results.
//                             </p>
//                           </div>
//                         ) : (
//                           <div className="w-full text-center space-y-3">
//                             <div className="flex items-center justify-center gap-2 text-green-500 text-xs mb-1">
//                               <CheckCircle2 size={14} /> Clear Recording Captured
//                             </div>
//                             <audio src={audioUrl} controls className="w-full h-10" />
//                             <Button
//                               variant="ghost"
//                               size="sm"
//                               onClick={() => setAudioUrl(null)}
//                               className="text-zinc-500 hover:text-white"
//                             >
//                               Retake Recording
//                             </Button>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                     <DialogFooter>
//                       <Button
//                         className="w-full bg-blue-600 hover:bg-blue-700"
//                         onClick={handleSaveVoice}
//                         disabled={!audioUrl || !voiceName}
//                       >
//                         Save to Library
//                       </Button>
//                     </DialogFooter>
//                   </DialogContent>
//                 </Dialog>

//                 {!isCollapsed && (
//                   <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2 mb-4">
//                     Your Voices
//                   </h3>
//                 )}

//                 <ScrollArea className="flex-1">
//                   {isLoading ? (
//                     <div className="p-4 flex justify-center">
//                       <Loader2 className="animate-spin h-5 w-5 text-zinc-700" />
//                     </div>
//                   ) : (
//                     clonedVoices.map((v) => (
//                       <div
//                         key={v.voice_id}
//                         onClick={() => setSelectedVoice(v.voice_id)}
//                         className={`
//                           flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}
//                           p-3 mb-1 rounded-lg cursor-pointer transition-all
//                           ${selectedVoice === v.voice_id
//                             ? 'bg-zinc-800 border-zinc-700 shadow-md'
//                             : 'hover:bg-zinc-800/50'}
//                         `}
//                       >
//                         <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
//                           <Button
//                             size="icon"
//                             variant="ghost"
//                             className="h-8 w-8 rounded-full bg-zinc-900 hover:bg-blue-600 hover:text-white flex-shrink-0"
//                             onClick={(e) => togglePreview(v.voiceUrl, e)}
//                           >
//                             {playingVoice === v.voiceUrl ? (
//                               <Square size={12} fill="currentColor" />
//                             ) : (
//                               <Play size={12} fill="currentColor" />
//                             )}
//                           </Button>

//                           {!isCollapsed && (
//                             <span
//                               className={`text-sm font-medium ${selectedVoice === v.voice_id ? 'text-white' : 'text-zinc-400'
//                                 }`}
//                             >
//                               {v.name}
//                             </span>
//                           )}
//                         </div>
//                       </div>
//                     ))
//                   )}
//                 </ScrollArea>


//               </>
//             )}

//             {activeTab === "text-to-speech" && (
//               <>
//                 {isCollapsed ? (
//                   <div className="flex justify-center">
//                     <div className="p-3 bg-blue-600 rounded-lg">
//                       <Mic size={20} className="text-white" />
//                     </div>
//                   </div>
//                 ) : (
//                   <p className="flex items-center bg-gray-900 gap-2 border border-blue-800 text-white px-4 py-2 rounded-sm capitalize">
//                     <Mic size={20} className="text-white" />
//                     text to speech
//                   </p>
//                 )}
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     </aside>
//   );
// }