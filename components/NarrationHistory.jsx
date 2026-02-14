import { ListMusic, Play, Download } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NarrationHistory({ recentNarrations }) {
  return (
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
              <Card key={item._id} className="bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 group">
                <CardContent className="p-4 flex items-center gap-3">
                  <Button size="icon" className="h-10 w-10 rounded-full bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white" onClick={() => new Audio(item.audioUrl).play()}>
                    <Play size={16} fill="currentColor" />
                  </Button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-zinc-200">{item.title || "Untitled Narration"}</p>
                    <p className="text-[10px] text-zinc-500">{item.voiceName} • {item.mood}</p>
                  </div>
                  <a href={item.audioUrl} download className="opacity-0 group-hover:opacity-100 p-2">
                    <Download size={14} className="text-zinc-500" />
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}