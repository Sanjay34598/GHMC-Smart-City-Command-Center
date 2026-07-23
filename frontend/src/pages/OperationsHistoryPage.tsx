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

interface OperationsArchivalRecord {
  id: string
  title: string
  category: string
  location: string
  reportedTime: string
  resolvedTime: string
  responseDuration: string
  aiConfidence: string
  departmentsResponded: string[]
  beforeStatus: string
  afterStatus: string
  imagePath: string
}

const archivedIncidents: OperationsArchivalRecord[] = [
  {
    id: 'INC-890',
    title: 'Structural Wall Spalling',
    category: 'Building Collapse',
    location: 'Ward 108 · Kukatpally Sector 4',
    reportedTime: '08:14 AM',
    resolvedTime: '09:40 AM',
    responseDuration: '1h 26m',
    aiConfidence: '96%',
    departmentsResponded: ['GHMC Engineering', 'Disaster Response Force (DRF)', 'Traffic Police'],
    beforeStatus: 'Pending Verification',
    afterStatus: 'Resolved',
    imagePath: '/uploads/building_collapse.jpeg',
  },
  {
    id: 'INC-742',
    title: 'Main Pipeline Pressure Burst',
    category: 'Water Leak',
    location: 'Ward 95 · Madhapur Junction',
    reportedTime: '06:30 AM',
    resolvedTime: '07:45 AM',
    responseDuration: '1h 15m',
    aiConfidence: '94%',
    departmentsResponded: ['HMWS&SB Water Works', 'GHMC Rapid Response'],
    beforeStatus: 'Reported',
    afterStatus: 'Resolved',
    imagePath: '/uploads/water_leak.jpg',
  },
  {
    id: 'INC-611',
    title: 'Commercial Zone Fire Anomaly',
    category: 'Fire',
    location: 'Ward 112 · Gachibowli Area',
    reportedTime: '02:10 AM',
    resolvedTime: '03:05 AM',
    responseDuration: '55m',
    aiConfidence: '98%',
    departmentsResponded: ['Fire Services Unit U-104', 'Police Dept', 'Emergency Ambulance'],
    beforeStatus: 'Under Review',
    afterStatus: 'Resolved',
    imagePath: '/uploads/fire.jpeg',
  },
]

export function OperationsHistoryPage() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<OperationsArchivalRecord>(archivedIncidents[0])

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
                <h2 className="text-lg font-bold text-textPrimary uppercase tracking-wider mb-1">{selectedRecord.id}: {selectedRecord.title}</h2>
                <span className="text-[10px] font-bold text-textSecondary font-mono uppercase tracking-widest">{selectedRecord.afterStatus} • {selectedRecord.location}</span>
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
                <span>Reported: {selectedRecord.reportedTime}</span>
                <span>Resolved: {selectedRecord.resolvedTime} ({selectedRecord.responseDuration})</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest flex items-center gap-2 mb-3">
                  <Camera className="size-3" /> Initial Evidence State
                </h3>
                <div className="aspect-video bg-black border border-border overflow-hidden relative group">
                  <img src={selectedRecord.imagePath} alt="Before" className="w-full h-full object-cover opacity-60 grayscale group-hover:opacity-100 group-hover:grayscale-0 transition-all" onError={(e) => { (e.target as HTMLImageElement).src = '/uploads/demo_placeholder.jpg' }} />
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">Before: {selectedRecord.beforeStatus}</div>
                </div>
              </div>
              <div>
                <h3 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest flex items-center gap-2 mb-3">
                  <CheckCircle2 className="size-3 text-resolved" /> Resolution Confirmation
                </h3>
                <div className="aspect-video bg-black border border-border overflow-hidden relative group">
                  <img src={selectedRecord.imagePath} alt="After" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" onError={(e) => { (e.target as HTMLImageElement).src = '/uploads/demo_placeholder.jpg' }} />
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">After: {selectedRecord.afterStatus}</div>
                </div>
              </div>
            </div>
          </div>

          {/* FEATURE 5: COMPLETED INCIDENTS ARCHIVAL AUDIT LIST */}
          <section className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-textSecondary flex items-center gap-2">
              <FileText className="size-4 text-info" /> Completed Incident Audit Logs
            </h2>

            <div className="grid grid-cols-1 gap-4">
              {archivedIncidents.map((record) => (
                <div 
                  key={record.id}
                  onClick={() => setSelectedRecord(record)}
                  className={`panel p-4 cursor-pointer transition-all border ${selectedRecord.id === record.id ? 'border-info bg-[#1A202C]' : 'border-border bg-panel hover:border-textSecondary'}`}
                >
                  <div className="flex flex-col md:flex-row gap-4 items-stretch">
                    <img
                      src={record.imagePath}
                      alt={record.title}
                      className="w-full md:w-40 h-28 object-cover rounded border border-border shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/uploads/demo_placeholder.jpg' }}
                    />

                    <div className="flex-1 flex flex-col justify-between space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold font-mono text-info">{record.id}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider bg-info/10 text-info border border-info/20">{record.category}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider bg-resolved/10 text-resolved border border-resolved/20">{record.afterStatus}</span>
                          </div>
                          <h3 className="text-sm font-bold text-textPrimary">{record.title}</h3>
                          <p className="text-[10px] font-mono text-textSecondary">{record.location}</p>
                        </div>

                        <div className="text-right font-mono text-[10px]">
                          <span className="text-textSecondary block uppercase">AI Confidence</span>
                          <span className="font-bold text-info text-xs">{record.aiConfidence}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-border/60 text-[10px] font-mono">
                        <div>
                          <span className="text-textSecondary text-[8px] uppercase block">Reported Time</span>
                          <span className="text-textPrimary">{record.reportedTime}</span>
                        </div>
                        <div>
                          <span className="text-textSecondary text-[8px] uppercase block">Resolved Time</span>
                          <span className="text-textPrimary">{record.resolvedTime}</span>
                        </div>
                        <div>
                          <span className="text-textSecondary text-[8px] uppercase block">Response Duration</span>
                          <span className="text-resolved font-bold">{record.responseDuration}</span>
                        </div>
                        <div>
                          <span className="text-textSecondary text-[8px] uppercase block">Status Shift</span>
                          <span className="text-textPrimary">{record.beforeStatus} → <strong className="text-resolved">{record.afterStatus}</strong></span>
                        </div>
                      </div>

                      <div className="pt-1 flex items-center gap-1.5 text-[9px] font-mono text-textSecondary">
                        <span className="font-bold uppercase text-info">Responded Depts:</span>
                        <span>{record.departmentsResponded.join(' • ')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </RootLayout>
  )
}
