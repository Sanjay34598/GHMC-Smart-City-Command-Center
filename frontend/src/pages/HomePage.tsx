import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, CloudLightning, Activity, AlertTriangle, BatteryWarning, Droplets, Train, Calendar, Zap, ArrowRight, Play, CheckCircle2 } from 'lucide-react'
import { RootLayout } from '@/components/layout/RootLayout'

// Seeded Data for Intelligence Widgets
const cityIntelligence = [
  { id: 'health', icon: ShieldCheck, label: 'City Health Score', value: '92 / 100', color: 'text-info' },
  { id: 'emergency', icon: AlertTriangle, label: 'Emergency Level', value: 'Level 2 (Elevated)', color: 'text-high' },
  { id: 'power', icon: BatteryWarning, label: 'Power Grid', value: '98.5% Stable', color: 'text-resolved' },
  { id: 'water', icon: Droplets, label: 'Water Supply', value: 'Zone 4 Pressure Drop', color: 'text-high' },
  { id: 'metro', icon: Train, label: 'Metro Status', value: 'Fully Operational', color: 'text-resolved' },
  { id: 'festival', icon: Calendar, label: 'Active Events', value: 'Bonalu (Old City)', color: 'text-purple-400' },
]

const aiRecommendations = [
  "High flood probability in LB Nagar. Recommend shifting 4 additional pump units from Secunderabad.",
  "Traffic congestion expected near Hitech City. Suggesting dynamic rerouting of GHMC sanitation fleets."
]

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

function MissionControlContext() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col h-full bg-panel">
      <div className="p-4 border-b border-border bg-[#1A202C]">
        <h3 className="text-xs font-bold text-textSecondary uppercase tracking-widest flex items-center gap-2">
          <Activity className="size-4" /> System Context
        </h3>
      </div>
      
      <div className="p-4 space-y-6 flex-1 overflow-y-auto">
        
        <div>
          <h4 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-3">Live Weather & Environment</h4>
          <div className="bg-primary border border-border p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-textPrimary">Heavy Rain Alert</span>
              <CloudLightning className="size-4 text-info" />
            </div>
            <p className="text-xs text-textSecondary">Expected 45mm rainfall over the next 3 hours across Central Zone.</p>
          </div>
        </div>

        <div>
          <h4 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-3">Traffic Conditions</h4>
          <div className="bg-primary border border-border p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-high">Severe Gridlock</span>
              <AlertTriangle className="size-4 text-high" />
            </div>
            <p className="text-xs text-textSecondary">Average speed in Madhapur dropped to 12 km/h due to waterlogging.</p>
          </div>
        </div>

        <div>
          <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-3">AI Recommendations</h4>
          <div className="space-y-3">
            {aiRecommendations.map((rec, i) => (
              <div key={i} className="border-l-2 border-purple-500 bg-primary p-3">
                <p className="text-xs text-textPrimary leading-relaxed">{rec}</p>
                <button onClick={() => navigate('/resources')} className="mt-2 text-[10px] font-bold text-purple-400 hover:text-purple-300 uppercase tracking-wider flex items-center gap-1">
                  Allocate Resources <ArrowRight className="size-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function HomePage() {
  const navigate = useNavigate()
  const [demoStep, setDemoStep] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(true)

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

  return (
    <RootLayout rightPanel={<MissionControlContext />}>
      <div className="p-6 max-w-5xl mx-auto space-y-8">
        
        <header className="border-b border-border pb-4">
          <h1 className="text-3xl font-black uppercase tracking-tight text-textPrimary">Mission Control</h1>
          <p className="text-xs font-bold text-textSecondary uppercase tracking-widest mt-1">Live Operations Overview • Greater Hyderabad</p>
        </header>

        {/* City Overview Matrix */}
        <section>
          <h2 className="text-xs font-bold text-textSecondary uppercase tracking-widest mb-4">City Status Matrix</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {cityIntelligence.map(intel => (
              <div key={intel.id} className="panel p-4 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <intel.icon className={`size-4 ${intel.color}`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-textSecondary">{intel.label}</span>
                </div>
                <div className="text-lg font-bold text-textPrimary">{intel.value}</div>
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
                <span className="text-[10px] bg-info/10 text-info font-bold px-2 py-1 border border-info/20 uppercase animate-pulse flex items-center gap-1">
                  <Play className="size-3" /> Incoming Alert
                </span>
              ) : (
                <button onClick={() => { setDemoStep(-1); setIsPlaying(true); }} className="text-[10px] bg-[#30363D] text-textPrimary hover:bg-[#30363D]/80 font-bold px-2 py-1 uppercase flex items-center gap-1 transition-colors">
                  <Play className="size-3" /> Replay Demo
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
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-info' : isPassed ? 'text-resolved' : 'text-textSecondary'}`}>Seq {idx + 1}</span>
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
                <button onClick={() => navigate('/incidents/INC-890')} className="bg-[#30363D] hover:bg-[#30363D]/80 text-textPrimary text-xs font-bold px-6 py-2 uppercase tracking-widest transition-colors flex items-center gap-2">
                  Review Incident <ArrowRight className="size-4" />
                </button>
              </div>
            )}
          </div>
        </section>

      </div>
    </RootLayout>
  )
}
