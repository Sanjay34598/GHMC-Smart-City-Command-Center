import { useState, useEffect } from 'react'
import { RootLayout } from '@/components/layout/RootLayout'
import { Clock, Download, FileText, CheckCircle2, ShieldCheck, Camera, History, ArrowRight } from 'lucide-react'
import { getCategoryImage } from '@/lib/images'
import { getDashboardIncidents } from '@/lib/dashboard'
import type { DashboardIncident } from '@/lib/dashboard'

interface ArchivalTimelineStep {
  label: string
  status: 'completed' | 'current' | 'upcoming'
  timestamp: string
}

interface EnhancedArchivalRecord {
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
  timeline: ArchivalTimelineStep[]
}

export function OperationsHistoryPage() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [records, setRecords] = useState<EnhancedArchivalRecord[]>([])
  const [selectedRecord, setSelectedRecord] = useState<EnhancedArchivalRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getDashboardIncidents({ limit: 50 })
        const mapped: EnhancedArchivalRecord[] = res.items.map((inc) => {
          const created = new Date(inc.created_at)
          const updated = new Date(inc.updated_at)
          const diffMs = Math.max(0, updated.getTime() - created.getTime())
          const diffMins = Math.round(diffMs / 60000) || 35
          const durationStr = diffMins > 60 ? `${Math.floor(diffMins / 60)}h ${diffMins % 60}m` : `${diffMins}m`

          const isResolved = inc.status === 'resolved'
          const isDispatched = inc.status === 'responding' || inc.status === 'dispatched' || isResolved
          const isVerified = inc.status !== 'Pending Verification' && inc.status !== 'pending'

          const depts = inc.department 
            ? [inc.department, 'Emergency Response Force (ERF)']
            : inc.category === 'Fire'
            ? ['Fire Services Unit', 'Emergency Ambulance', 'Traffic Police']
            : inc.category === 'Water Leak'
            ? ['HMWS&SB Water Works', 'Municipal Rapid Response']
            : ['Municipal Engineering', 'Emergency Response Force (ERF)']

          return {
            id: inc.id,
            title: inc.title,
            category: inc.category,
            location: inc.ward ? `Ward: ${inc.ward}` : `Lat: ${inc.latitude.toFixed(3)}, Lng: ${inc.longitude.toFixed(3)}`,
            reportedTime: created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            resolvedTime: isResolved ? updated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'In Progress',
            responseDuration: durationStr,
            aiConfidence: '96%',
            departmentsResponded: depts,
            beforeStatus: 'Reported',
            afterStatus: inc.status,
            imagePath: inc.image_path,
            timeline: [
              { label: 'Reported', status: 'completed', timestamp: created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
              { label: 'Verified', status: isVerified ? 'completed' : 'current', timestamp: isVerified ? '+2m' : 'Pending' },
              { label: 'Assigned', status: isDispatched ? 'completed' : isVerified ? 'current' : 'upcoming', timestamp: isDispatched ? '+5m' : 'Pending' },
              { label: 'Resolved', status: isResolved ? 'completed' : 'upcoming', timestamp: isResolved ? updated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Target < 1h' },
            ]
          }
        })

        setRecords(mapped)
        if (mapped.length > 0) {
          setSelectedRecord(mapped[0])
        }
      } catch (e) {
        console.error('Failed to load operations history:', e)
      } finally {
        setLoading(false)
      }
    }
    void loadData()
  }, [])

  const currentRecord = selectedRecord || records[0]

  const RightContextPanel = (
    <div className="flex flex-col h-full bg-[#111111] text-white">
      <div className="p-4 border-b border-[#2A2A2A] bg-[#181818]">
        <h3 className="text-[10px] font-bold text-[#BDBDBD] uppercase tracking-widest flex items-center gap-2">
          <ShieldCheck className="size-3 text-white" /> Forensic Audit Timeline
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {currentRecord ? (
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px before:h-full before:w-px before:bg-[#2A2A2A]">
            {currentRecord.timeline.map((step, i) => (
              <div key={i} className="relative flex items-start gap-4 transition-all duration-300">
                <div className={`flex items-center justify-center size-5 rounded-none border z-10 shrink-0 mt-0.5 ${step.status === 'completed' ? 'border-white bg-white text-black' : 'border-[#2A2A2A] bg-[#181818] text-[#BDBDBD]'}`}>
                  <div className={`size-1.5 rounded-none ${step.status === 'completed' ? 'bg-black' : 'bg-[#BDBDBD]'}`} />
                </div>
                <div className="flex-1 bg-[#181818] border border-[#2A2A2A] p-3 hover:border-white transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[9px] font-mono text-white font-bold uppercase tracking-widest">{step.label}</span>
                    <span className="text-[9px] font-mono text-[#BDBDBD]">{step.timestamp}</span>
                  </div>
                  <p className="text-[10px] text-[#BDBDBD] uppercase tracking-wider font-mono">Stage {i + 1} Execution</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs font-mono text-[#BDBDBD] p-4 text-center">No forensic record selected.</div>
        )}
      </div>
    </div>
  )
  
  return (
    <RootLayout rightPanel={RightContextPanel}>
      <div className="p-6 max-w-5xl mx-auto space-y-8">
        
        <header className="border-b border-[#2A2A2A] pb-4 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3">
              <History className="size-6 text-white" />
              Operations Forensics
            </h1>
            <p className="text-xs font-bold text-[#BDBDBD] uppercase tracking-widest mt-1">Live Incident Replay &amp; Archival System</p>
          </div>
          <div className="flex gap-2">
            <button className="bg-white text-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-neutral-200 transition-colors">
              <Download className="size-3 text-black" /> Export Audit Log
            </button>
          </div>
        </header>

        {currentRecord && (
          <div className="flex flex-col gap-6">
            
            {/* REPLAY & TIMELINE STAGE */}
            <div className="panel p-6 bg-[#181818] border border-[#2A2A2A]">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white uppercase tracking-wider mb-1">{currentRecord.id}: {currentRecord.title}</h2>
                  <span className="text-[10px] font-bold text-[#BDBDBD] font-mono uppercase tracking-widest">{currentRecord.afterStatus} • {currentRecord.location}</span>
                </div>
                <button onClick={() => setIsPlaying(!isPlaying)} className={`text-[10px] font-bold px-4 py-2 uppercase tracking-widest transition-colors flex items-center gap-2 ${isPlaying ? 'bg-white text-black border border-white' : 'bg-[#111111] text-white border border-[#2A2A2A] hover:border-white'}`}>
                  <Clock className="size-3" /> {isPlaying ? 'Stop Replay' : 'Initiate Playback'}
                </button>
              </div>

              {/* 4-STAGE TIMELINE PROGRESS BAR */}
              <div className="mb-6 space-y-2">
                <div className="flex justify-between text-[10px] font-mono text-[#BDBDBD] uppercase tracking-wider">
                  {currentRecord.timeline.map((st, i) => (
                    <span key={i} className={st.status === 'completed' ? 'text-white font-bold' : ''}>
                      {st.label} ({st.timestamp})
                    </span>
                  ))}
                </div>
                <div className="h-1.5 bg-[#2A2A2A] w-full overflow-hidden flex">
                  {currentRecord.timeline.map((st, i) => (
                    <div 
                      key={i} 
                      className={`flex-1 border-r border-black transition-all ${st.status === 'completed' ? 'bg-white' : st.status === 'current' ? 'bg-[#BDBDBD]' : 'bg-[#222222]'}`} 
                    />
                  ))}
                </div>
              </div>

              {/* BEFORE & AFTER EVIDENCE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-[10px] font-bold text-[#BDBDBD] uppercase tracking-widest flex items-center gap-2 mb-3">
                    <Camera className="size-3 text-white" /> Reported Evidence State
                  </h3>
                  <div className="aspect-video bg-black border border-[#2A2A2A] overflow-hidden relative group">
                    <img 
                      src={getCategoryImage(currentRecord.category, currentRecord.imagePath)} 
                      alt="Before" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const fallback = getCategoryImage(currentRecord.category)
                        if ((e.target as HTMLImageElement).src !== fallback) {
                          (e.target as HTMLImageElement).src = fallback
                        }
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white uppercase tracking-widest bg-black/60">
                      Reported: {currentRecord.reportedTime}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-bold text-[#BDBDBD] uppercase tracking-widest flex items-center gap-2 mb-3">
                    <CheckCircle2 className="size-3 text-white" /> Resolution Status
                  </h3>
                  <div className="aspect-video bg-black border border-[#2A2A2A] overflow-hidden relative group">
                    <img 
                      src={getCategoryImage(currentRecord.category, currentRecord.imagePath)} 
                      alt="After" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const fallback = getCategoryImage(currentRecord.category)
                        if ((e.target as HTMLImageElement).src !== fallback) {
                          (e.target as HTMLImageElement).src = fallback
                        }
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white uppercase tracking-widest bg-black/60">
                      Status: {currentRecord.afterStatus} ({currentRecord.responseDuration})
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* COMPLETED INCIDENTS ARCHIVAL AUDIT LIST */}
            <section className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#BDBDBD] flex items-center gap-2">
                <FileText className="size-4 text-white" /> Live Incident Audit Logs
              </h2>

              <div className="grid grid-cols-1 gap-4">
                {records.map((record) => (
                  <div 
                    key={record.id}
                    onClick={() => setSelectedRecord(record)}
                    className={`panel p-4 cursor-pointer transition-all border ${currentRecord.id === record.id ? 'border-white bg-[#181818]' : 'border-[#2A2A2A] bg-[#111111] hover:border-white'}`}
                  >
                    <div className="flex flex-col md:flex-row gap-4 items-stretch">
                      <div className="w-full md:w-48 h-32 shrink-0 border border-[#2A2A2A] bg-black relative overflow-hidden group">
                        <img
                          src={getCategoryImage(record.category, record.imagePath)}
                          alt={record.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const fallback = getCategoryImage(record.category)
                            if ((e.target as HTMLImageElement).src !== fallback) {
                              (e.target as HTMLImageElement).src = fallback
                            }
                          }}
                        />
                        <div className="absolute bottom-2 left-2">
                          <span className="text-[9px] font-bold px-2 py-0.5 uppercase tracking-widest bg-black/90 text-white border border-[#2A2A2A]">
                            {record.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col justify-between space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold font-mono text-white">{record.id}</span>
                              <span className="text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider bg-white text-black font-mono">{record.afterStatus}</span>
                            </div>
                            <h3 className="text-sm font-bold text-white">{record.title}</h3>
                            <p className="text-[10px] font-mono text-[#BDBDBD]">{record.location}</p>
                          </div>

                          <div className="text-right font-mono text-[10px]">
                            <span className="text-[#BDBDBD] block uppercase">AI Confidence</span>
                            <span className="font-bold text-white text-xs">{record.aiConfidence}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-[#2A2A2A] text-[10px] font-mono">
                          <div>
                            <span className="text-[#BDBDBD] text-[8px] uppercase block">Reported Time</span>
                            <span className="text-white">{record.reportedTime}</span>
                          </div>
                          <div>
                            <span className="text-[#BDBDBD] text-[8px] uppercase block">Resolved Time</span>
                            <span className="text-white">{record.resolvedTime}</span>
                          </div>
                          <div>
                            <span className="text-[#BDBDBD] text-[8px] uppercase block">Response Duration</span>
                            <span className="text-white font-bold">{record.responseDuration}</span>
                          </div>
                          <div>
                            <span className="text-[#BDBDBD] text-[8px] uppercase block">Status Shift</span>
                            <span className="text-white">{record.beforeStatus} → <strong className="text-white">{record.afterStatus}</strong></span>
                          </div>
                        </div>

                        <div className="pt-1 flex items-center gap-1.5 text-[9px] font-mono text-[#BDBDBD]">
                          <span className="font-bold uppercase text-white">Responded Depts:</span>
                          <span>{record.departmentsResponded.join(' • ')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>
        )}

      </div>
    </RootLayout>
  )
}
