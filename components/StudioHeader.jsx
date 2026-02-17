import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";

export default function StudioHeader({ 
  selectedVoice, setSelectedVoice, clonedVoices, mood, setMood, 
  targetDuration, setTargetDuration, handleGenerateTTS, isGenerating 
}) {
  return (
    <header className="h-20 border-b border-zinc-800 flex items-center justify-between px-8 bg-[#09090b]/50 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <p className="text-sm text-zinc-400">Text to Speech</p>
        <Select value={selectedVoice} onValueChange={setSelectedVoice}>
          <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-800 h-10 text-white"><SelectValue placeholder="Voice" /></SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
            {clonedVoices.map(v => <SelectItem key={v.voice_id} value={v.voice_id}>{v.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={mood} onValueChange={setMood}>
          <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-800 h-10 text-white"><SelectValue placeholder="Select Mood" /></SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-[300px]">
             {/* ... (Your existing SelectGroups for moods) ... */}
             <SelectGroup>
                <SelectLabel className="text-zinc-500 text-xs">Positive & Calm</SelectLabel>
                <SelectItem value="calm">Calm</SelectItem>
                <SelectItem value="happy">Happy</SelectItem>
             </SelectGroup>
             {/* Add other groups here as in your original code */}
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
  );
}