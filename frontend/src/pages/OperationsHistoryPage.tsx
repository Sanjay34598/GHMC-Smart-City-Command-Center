import { useState } from 'react'
import { RootLayout } from '@/components/layout/RootLayout'
import { Clock, Download, FileText, CheckCircle2, ShieldCheck, Camera, History, Navigation, ArrowRight } from 'lucide-react'

const historyLog = [
  { time: '08:14', action: 'Citizen Report Received via App', source: 'User-9192' },
  { time: '08:15', action: 'YOLOv11 Detected Severe Structural Damage', source: 'AI Vision' },
  { time: '08:15', action: 'Incident Escalated to Critical', source: 'Automated Routing' },
  { time: '08:17', action: 'GHMC Engineering Team Dispatched', source: 'Dispatcher K. Rao' },
  { time: '08:35', action: 'Team Arrived On Scene', source: 'Unit U-1042' },
  { time: '09:40', action: 'Hazard Secured & Debris Cleared', source: 'Unit U-1042' },
  { time: '09:45', action: 'Incident Marked Resolved', source: 'Command Center' },
]

export function OperationsHistoryPage() {
  const [isPlaying, setIsPlaying] = useState(false)

  const RightContextPanel = (
    <div className="flex flex-col h-full bg-panel text-textPrimary">
      <div className="p-4 border-b border-border bg-[#1A202C]">
        <h3 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest flex items-center gap-2">
          <ShieldCheck className="size-3" /> Forensic Timeline
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px before:h-full before:w-px before:bg-border">
          {historyLog.map((log, i) => (
            <div key={i} className={`relative flex items-start gap-4 transition-all duration-500 ${isPlaying ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}>
              <div className="flex items-center justify-center size-5 rounded-full border border-border bg-primary z-10 shrink-0 mt-0.5">
                <div className={`size-1.5 rounded-full ${i === historyLog.length - 1 ? 'bg-resolved' : 'bg-textSecondary'}`} />
              </div>
              <div className="flex-1 bg-primary border border-border p-3 hover:border-textSecondary transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[9px] font-mono text-info font-bold uppercase tracking-widest">{log.time}</span>
                </div>
                <p className="text-xs font-bold text-textPrimary leading-tight mb-1">{log.action}</p>
                <p className="text-[9px] text-textSecondary uppercase tracking-wider font-mono">{log.source}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
  
  return (
    <RootLayout rightPanel={RightContextPanel}>
      <div className="p-6 max-w-5xl mx-auto space-y-8">
        
        <header className="border-b border-border pb-4 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-textPrimary flex items-center gap-3">
              <History className="size-6 text-textSecondary" />
              Operations Forensics
            </h1>
            <p className="text-xs font-bold text-textSecondary uppercase tracking-widest mt-1">Incident Replay & Archival System</p>
          </div>
          <div className="flex gap-2">
            <button className="bg-panel border border-border hover:bg-[#30363D] text-textPrimary px-4 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors">
              <Download className="size-3 text-info" /> Export PDF
            </button>
          </div>
        </header>

        <div className="flex flex-col gap-6">
          
          <div className="panel p-6 bg-[#1A202C]">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-lg font-bold text-textPrimary uppercase tracking-wider mb-1">INC-890: Structural Collapse</h2>
                <span className="text-[10px] font-bold text-textSecondary font-mono uppercase tracking-widest">Resolved • Kukatpally • GHMC Engineering</span>
              </div>
              <button onClick={() => setIsPlaying(!isPlaying)} className={`text-[10px] font-bold px-4 py-2 uppercase tracking-widest transition-colors flex items-center gap-2 ${isPlaying ? 'bg-critical/10 text-critical border border-critical/30' : 'bg-info/10 hover:bg-info text-info hover:text-white border border-info/30'}`}>
                <Clock className="size-3" /> {isPlaying ? 'Stop Replay' : 'Initiate Playback'}
              </button>
            </div>

            <div className="mb-6 relative">
              <div className="h-1 bg-border w-full overflow-hidden">
                <div className={`h-full bg-info transition-all duration-[10000ms] ${isPlaying ? 'w-full' : 'w-0'}`}></div>
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-textSecondary font-mono font-bold uppercase tracking-widest">
                <span>T-00:00</span>
                <span>T-01:31</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest flex items-center gap-2 mb-3">
                  <Camera className="size-3" /> Initial State (T-00)
                </h3>
                <div className="aspect-video bg-black border border-border overflow-hidden relative group">
                  <img src="/media_af74e44b-eb9c-4457-9a53-7f8cab0ba813_1784210089576.png" alt="Before" className="w-full h-full object-cover opacity-50 grayscale group-hover:opacity-80 group-hover:grayscale-0 transition-all" />
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">Archived Evidence</div>
                </div>
              </div>
              <div>
                <h3 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest flex items-center gap-2 mb-3">
                  <CheckCircle2 className="size-3 text-resolved" /> Resolved State (T-End)
                </h3>
                <div className="aspect-video bg-black border border-border overflow-hidden relative group">
                  <img src="/media_af74e44b-eb9c-4457-9a53-7f8cab0ba813_1784210200570.png" alt="After" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">Resolution Confirmation</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-info/5 border border-info/20 p-5">
              <h3 className="text-[10px] font-bold text-info uppercase tracking-widest flex items-center gap-2 mb-3">
                <FileText className="size-3" /> AI Post-Mortem
              </h3>
              <p className="text-xs text-textPrimary leading-relaxed">
                At 08:14, a citizen reported structural damage near Kukatpally. YOLOv11 immediately identified severe concrete spalling with 94% confidence. The Gemini LLM escalated the incident to Critical status based on historical collapse data in the region. GHMC Engineering Unit U-1042 was dispatched at 08:17, secured the perimeter, and resolved the structural risk by 09:40. No casualties reported.
              </p>
            </div>

            <div className="panel p-5 bg-primary">
              <h3 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest flex items-center gap-2 mb-3">
                <Navigation className="size-3 text-medium" /> Department Resolution Notes
              </h3>
              <p className="text-xs text-textSecondary leading-relaxed mb-4">
                Structure was stabilized using heavy support beams. Remaining loose debris was cleared from the immediate walkway. Area cordoned off with safety tape. Structural integrity team requires a follow-up assessment within 48 hours.
              </p>
              <button className="text-[9px] font-bold text-info uppercase tracking-widest flex items-center gap-1 hover:text-white transition-colors">
                Schedule Follow-up <ArrowRight className="size-2.5" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </RootLayout>
  )
}
