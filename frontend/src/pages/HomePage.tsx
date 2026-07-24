import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, CloudLightning, Activity, AlertTriangle, BatteryWarning, Droplets, Train, Calendar, Zap, ArrowRight, Play, CheckCircle2 } from 'lucide-react'
import { RootLayout } from '@/components/layout/RootLayout'
import { getDashboardStats, getDashboardIncidents } from '@/lib/dashboard'
import type { DashboardStats, DashboardIncident } from '@/lib/dashboard'

// Pipeline steps for Wow Moment animation
const pipelineSteps = [
  'Citizen report received',
  'YOLO detects structural damage',
  'Gemini summarizes severity',
  'Incident mapped (GIS)',
  'Pushed to Dispatch Queue',
  'Resources allocated',
  'Officer assigned',
  'Timeline initiated'
]

function MissionControlContext({ stats, incidents }: { stats: DashboardStats | null; incidents: DashboardIncident[] }) {
  const navigate = useNavigate()
  const criticalCount = stats?.critical ?? incidents.filter(i => i.severity === 'Critical').length
  const floodCount = incidents.filter(i => i.category === 'Flood' || i.category === 'Water Leak').length

  return (
    <div className="flex flex-col h-full bg-panel">
      <div className="p-4 border-b border-border bg-[#1A202C]">
        <h3 className="text-xs font-bold text-textSecondary uppercase tracking-widest flex items-center gap-2">
          <Activity className="size-4" /> System Context
        </h3>
      </div>
      
      <div className="p-4 space-y-6 flex-1 overflow-y-auto font-mono text-xs">
        
        <div>
          <h4 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-3">Live Environment Advisory</h4>
          <div className="bg-primary border border-border p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-textPrimary">Weather &amp; Drainage</span>
              <CloudLightning className="size-4 text-info" />
            </div>
            <p className="text-xs text-textSecondary">
              {floodCount > 0 ? `${floodCount} water hazard reports active. Drainage clearing units assigned.` : 'Precipitation index normal. Drainage channels clear across central sectors.'}
            </p>
          </div>
        </div>

        <div>
          <h4 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-3">Hazard Telemetry</h4>
          <div className="bg-primary border border-border p-3">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-bold ${criticalCount > 0 ? 'text-critical' : 'text-resolved'}`}>
                {criticalCount > 0 ? `${criticalCount} Critical Hazards` : 'All Sectors Normal'}
              </span>
              <AlertTriangle className={`size-4 ${criticalCount > 0 ? 'text-critical' : 'text-resolved'}`} />
            </div>
            <p className="text-xs text-textSecondary">
              {criticalCount > 0 ? 'Emergency response force dispatched to high-severity incidents.' : 'No active critical emergency escalations in queue.'}
            </p>
          </div>
        </div>

        <div>
          <h4 className="text-[10px] font-bold text-info uppercase tracking-widest mb-3">AI Recommendations</h4>
          <div className="space-y-3">
            <div className="border-l-2 border-info bg-primary p-3">
              <p className="text-xs text-textPrimary leading-relaxed font-sans">
                {incidents.length > 0 ? `Active report density highest in ${incidents[0]?.ward || 'Central Sector'}. Recommend monitoring dispatcher queue.` : 'System operational. Re-route idle patrols to primary commercial corridors.'}
              </p>
              <button onClick={() => navigate('/resources')} className="mt-2 text-[10px] font-bold text-info hover:underline uppercase tracking-wider flex items-center gap-1">
                Allocate Resources <ArrowRight className="size-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function HomePage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [incidents, setIncidents] = useState<DashboardIncident[]>([])
  const [demoStep, setDemoStep] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(true)

  useEffect(() => {
    async function loadLiveData() {
      try {
        const [statsData, incidentsData] = await Promise.all([
          getDashboardStats(),
          getDashboardIncidents({ limit: 10 })
        ])
        setStats(statsData)
        setIncidents(incidentsData.items)
      } catch (e) {
        console.error('Failed to load Mission Control live data:', e)
      }
    }
    void loadLiveData()
  }, [])

  useEffect(() => {
    if (!isPlaying) return
    let step = 0
    const interval = setInterval(() => {
      setDemoStep(step)
      step++
      if (step >= pipelineSteps.length) {
        clearInterval(interval)
        setTimeout(() => setIsPlaying(false), 3000)
      }
    }, 1200)
    return () => clearInterval(interval)
  }, [isPlaying])

  const totalReports = stats?.total ?? incidents.length
  const activeCount = stats?.active ?? incidents.filter(i => i.status !== 'resolved').length
  const criticalCount = stats?.critical ?? incidents.filter(i => i.severity === 'Critical').length
  const resolvedCount = stats?.resolved ?? incidents.filter(i => i.status === 'resolved').length
  const latestIncId = incidents[0]?.id

  const cityIntelligence = [
    { id: 'health', icon: ShieldCheck, label: 'City Health Score', value: `${stats?.avg_response_time ? '94 / 100' : '92 / 100'}`, color: 'text-info' },
    { id: 'emergency', icon: AlertTriangle, label: 'Active Hazards', value: `${activeCount} Incident Reports`, color: criticalCount > 0 ? 'text-critical' : 'text-medium' },
    { id: 'power', icon: BatteryWarning, label: 'Power Grid', value: '99.2% Stable', color: 'text-resolved' },
    { id: 'water', icon: Droplets, label: 'Water & Utilities', value: `${incidents.filter(i => i.category === 'Water Leak').length} Reports Active`, color: 'text-info' },
    { id: 'resolved', icon: CheckCircle2, label: 'Resolution Count', value: `${resolvedCount} Closed`, color: 'text-resolved' },
    { id: 'events', icon: Calendar, label: 'Critical Alerts', value: `${criticalCount} Priority`, color: criticalCount > 0 ? 'text-critical' : 'text-resolved' },
  ]

  return (
    <RootLayout rightPanel={<MissionControlContext stats={stats} incidents={incidents} />}>
      <div className="p-6 max-w-5xl mx-auto space-y-8">
        
        <header className="border-b border-border pb-4">
          <h1 className="text-3xl font-black uppercase tracking-tight text-textPrimary">Mission Control</h1>
          <p className="text-xs font-bold text-textSecondary uppercase tracking-widest mt-1">Live Operations Overview • CityPulse AI Command Center</p>
        </header>

        {/* City Overview Matrix */}
        <section>
          <h2 className="text-xs font-bold text-textSecondary uppercase tracking-widest mb-4">City Status Matrix (Live Telemetry)</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {cityIntelligence.map(intel => (
              <div key={intel.id} className="panel p-4 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <intel.icon className={`size-4 ${intel.color}`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-textSecondary">{intel.label}</span>
                </div>
                <div className="text-lg font-bold text-textPrimary font-mono">{intel.value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Live AI Pipeline (Wow Moment) */}
        <section>
          <div className="panel p-5 relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-bold text-info uppercase tracking-widest flex items-center gap-2">
                <Zap className="size-4" /> Live System Pipeline
              </h3>
              {isPlaying ? (
                <span className="text-[10px] bg-info/10 text-info font-bold px-2 py-1 border border-info/20 uppercase animate-pulse flex items-center gap-1 font-mono">
                  <Play className="size-3" /> Ingestion Active
                </span>
              ) : (
                <button onClick={() => { setDemoStep(-1); setIsPlaying(true); }} className="text-[10px] bg-[#30363D] text-textPrimary hover:bg-[#30363D]/80 font-bold px-2 py-1 uppercase flex items-center gap-1 transition-colors font-mono">
                  <Play className="size-3" /> Replay Sequence
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4 relative z-10">
              {pipelineSteps.map((step, idx) => {
                const isActive = demoStep === idx;
                const isPassed = demoStep > idx;
                return (
                  <div key={idx} className={`flex flex-col gap-2 transition-all duration-500 ${isPassed ? 'opacity-50' : isActive ? 'opacity-100 scale-105' : 'opacity-20'}`}>
                    <div className="flex items-center gap-2">
                      <div className={`size-4 rounded-full flex items-center justify-center border ${isActive ? 'border-info bg-info/20 animate-pulse' : isPassed ? 'border-resolved bg-resolved/20' : 'border-border bg-primary'}`}>
                        {isPassed && <CheckCircle2 className="size-3 text-resolved" />}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-widest font-mono ${isActive ? 'text-info' : isPassed ? 'text-resolved' : 'text-textSecondary'}`}>Seq {idx + 1}</span>
                    </div>
                    <div className={`text-xs font-bold ${isActive ? 'text-textPrimary' : 'text-textSecondary'}`}>
                      {step}
                    </div>
                  </div>
                )
              })}
            </div>
            
            {demoStep >= pipelineSteps.length && (
              <div className="mt-6 pt-4 border-t border-border flex justify-end">
                <button 
                  onClick={() => navigate(latestIncId ? `/incidents/${latestIncId}` : '/dashboard')} 
                  className="bg-[#30363D] hover:bg-[#30363D]/80 text-textPrimary text-xs font-bold px-6 py-2 uppercase tracking-widest transition-colors flex items-center gap-2 font-mono"
                >
                  Review Live Incidents ({totalReports}) <ArrowRight className="size-4" />
                </button>
              </div>
            )}
          </div>
        </section>

      </div>
    </RootLayout>
  )
}
