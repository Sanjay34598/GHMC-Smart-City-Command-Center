import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { RootLayout } from '@/components/layout/RootLayout'
import { getIncident, type IncidentResponse, type LLMAnalysisResponse } from '@/lib/incidents'
import { ArrowLeft, Clock, ShieldAlert, CheckCircle, Activity, Crosshair, ShieldCheck, Truck, FileText, Users, MessageSquare } from 'lucide-react'

const lifecycleSteps = [
  'Citizen Report',
  'AI Analysis',
  'Department Assignment',
  'Officer Assigned',
  'Work Started',
  'Progress Updates',
  'Resolved',
  'Citizen Notification',
  'Archived'
]

type AnalysisMock = {
  prediction_json: {
    detections: { label: string }[]
  }
}

type Agent = {
  id: string
  name: string
  role: string
  status: string
}

export function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<{ incident: IncidentResponse; analysis: AnalysisMock | null; llm: LLMAnalysisResponse | null; agents: Agent[] } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!id) return
      try {
        const res = await getIncident(id)
        setData({ 
          incident: res, 
          analysis: { prediction_json: { detections: [{ label: 'Pothole / Damage' }] } }, 
          llm: null, 
          agents: [] 
        })
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return (
      <RootLayout>
        <div className="flex h-full items-center justify-center text-[10px] text-textSecondary font-mono uppercase tracking-widest">
          Loading Incident Data...
        </div>
      </RootLayout>
    )
  }

  if (!data) {
    return (
      <RootLayout>
        <div className="flex h-full items-center justify-center text-[10px] text-critical font-mono uppercase tracking-widest">
          Incident Not Found
        </div>
      </RootLayout>
    )
  }

  const { incident, analysis, llm } = data

  let activeStep = 0
  const statusLower = incident.status.toLowerCase()
  if (statusLower.includes('resolved')) activeStep = 6
  else if (statusLower.includes('progress') || statusLower.includes('work started')) activeStep = 4
  else if (statusLower.includes('officer')) activeStep = 3
  else if (statusLower.includes('department')) activeStep = 2
  else if (statusLower.includes('ai') || analysis) activeStep = 1

  const RightContextPanel = (
    <div className="flex flex-col h-full bg-panel text-textPrimary">
      <div className="p-4 border-b border-border bg-[#1A202C]">
        <h3 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest flex items-center gap-2">
          <FileText className="size-3" /> Incident Context
        </h3>
      </div>
      
      <div className="p-4 space-y-6 flex-1 overflow-y-auto">
        
        {/* Evidence */}
        <div>
          <h4 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-3">Visual Evidence</h4>
          <div className="aspect-video bg-black relative border border-border">
            <img src={incident.image_path} alt="Evidence" className="w-full h-full object-cover opacity-80" />
            {analysis && (
              <div className="absolute inset-0 border border-critical/50 m-2 border-dashed bg-critical/5">
                <span className="absolute top-0 right-0 bg-critical text-white text-[8px] font-bold px-1 m-0.5">
                  YOLOv11: {analysis.prediction_json.detections?.[0]?.label || 'Anomaly'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div>
          <h4 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-3">Lifecycle Timeline</h4>
          <div className="relative pl-5 space-y-5 before:absolute before:inset-0 before:ml-1.5 before:-translate-x-px before:h-full before:w-px before:bg-border">
            {lifecycleSteps.map((step, idx) => {
              const isCompleted = idx <= activeStep
              const isCurrent = idx === activeStep
              
              return (
                <div key={idx} className="relative">
                  <div className={`absolute -left-5 flex items-center justify-center size-3 rounded-full border ${isCompleted ? 'bg-info border-info' : 'bg-primary border-border'}`}>
                    {isCurrent && <div className="size-1 bg-primary rounded-full animate-pulse" />}
                  </div>
                  
                  <div className={`${isCompleted ? 'text-textPrimary' : 'text-textSecondary'}`}>
                    <h4 className={`text-[10px] font-bold uppercase tracking-wider ${isCurrent ? 'text-info' : ''}`}>{step}</h4>
                    {isCurrent && (
                      <p className="text-[9px] text-textSecondary mt-1 font-mono">Active stage</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Resources */}
        <div>
          <h4 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-3">Allocated Resources</h4>
          <div className="space-y-2">
            <div className="border border-border bg-primary p-3 flex gap-3 items-center">
              <ShieldCheck className="size-4 text-resolved" />
              <div>
                <span className="text-xs font-bold text-textPrimary block">Officer K. Rao</span>
                <span className="text-[9px] text-textSecondary font-mono uppercase tracking-wider">TFS-89 · On Scene</span>
              </div>
            </div>
            <div className="border border-border bg-primary p-3 flex gap-3 items-center">
              <Truck className="size-4 text-medium" />
              <div>
                <span className="text-xs font-bold text-textPrimary block">Heavy Crane Unit 4</span>
                <span className="text-[9px] text-textSecondary font-mono uppercase tracking-wider">En Route</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )

  return (
    <RootLayout rightPanel={RightContextPanel}>
      <div className="p-6 max-w-5xl mx-auto space-y-8">
        
        <header className="border-b border-border pb-4 flex justify-between items-end">
          <div>
            <button onClick={() => navigate(-1)} className="text-[10px] text-info font-bold uppercase tracking-widest flex items-center gap-1 mb-4 hover:text-white transition-colors">
              <ArrowLeft className="size-3" /> Back
            </button>
            <h1 className="text-3xl font-black uppercase tracking-tight text-textPrimary flex items-center gap-3">
              Incident <span className="text-textSecondary">#{incident.id.split('-')[0]}</span>
            </h1>
          </div>
          <div className="flex gap-2 items-center">
            <span className={`px-2 py-1 text-[9px] border font-bold uppercase tracking-widest ${incident.severity === 'Critical' ? 'bg-critical/10 text-critical border-critical/30' : 'bg-high/10 text-high border-high/30'}`}>
              {incident.severity} Priority
            </span>
            <span className="px-2 py-1 bg-panel border border-border text-textSecondary text-[9px] font-bold uppercase tracking-widest">
              {incident.status}
            </span>
          </div>
        </header>

        <div className="grid lg:grid-cols-2 gap-6">
          
          {/* Main Content: Details */}
          <section className="flex flex-col gap-6">
            <div className="panel p-5">
              <h3 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-4">Initial Citizen Report</h3>
              
              <h2 className="text-lg font-bold text-textPrimary mb-2">{incident.title}</h2>
              <p className="text-sm text-textSecondary leading-relaxed mb-6">{incident.description}</p>
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="block text-[9px] text-textSecondary uppercase font-bold tracking-widest mb-1">Reported At</span>
                  <span className="text-textPrimary flex items-center gap-1 font-mono"><Clock className="size-3 text-textSecondary" /> {new Date(incident.created_at).toLocaleString()}</span>
                </div>
                <div>
                  <span className="block text-[9px] text-textSecondary uppercase font-bold tracking-widest mb-1">Location</span>
                  <span className="text-textPrimary font-mono">{incident.ward || 'Unknown'}</span>
                </div>
                <div>
                  <span className="block text-[9px] text-textSecondary uppercase font-bold tracking-widest mb-1">Coordinates</span>
                  <span className="text-textSecondary font-mono">{incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}</span>
                </div>
              </div>
            </div>

            {llm && (
              <div className="bg-info/5 border border-info/20 p-5">
                <h3 className="text-[10px] font-bold text-info uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Activity className="size-4" /> Gemini AI Synthesis
                </h3>
                <p className="text-sm text-textPrimary mb-4">{llm.summary}</p>
                <ul className="space-y-2">
                  {llm.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="text-xs text-textSecondary flex items-start gap-2">
                      <CheckCircle className="size-3 text-info shrink-0 mt-0.5" /> {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Secondary Content: Actions & Logs */}
          <section className="flex flex-col gap-6">
            <div className="panel p-5 bg-[#1A202C]">
              <h3 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-4">Command Actions</h3>
              <div className="space-y-3">
                <button onClick={() => navigate('/map')} className="w-full bg-panel border border-border hover:bg-[#30363D] text-textPrimary font-bold text-[10px] uppercase tracking-widest py-3 transition-colors flex justify-center items-center gap-2">
                  <Crosshair className="size-4 text-textSecondary" /> View on Map
                </button>
                <button onClick={() => navigate('/dashboard')} className="w-full bg-info/10 border border-info/30 hover:bg-info text-info hover:text-white font-bold text-[10px] uppercase tracking-widest py-3 transition-colors flex justify-center items-center gap-2">
                  <ShieldAlert className="size-4" /> Prepare Dispatch
                </button>
                <button className="w-full bg-resolved/10 border border-resolved/30 hover:bg-resolved text-resolved hover:text-white font-bold text-[10px] uppercase tracking-widest py-3 transition-colors flex justify-center items-center gap-2">
                  <CheckCircle className="size-4" /> Mark Resolved
                </button>
              </div>
            </div>

            <div className="panel p-5 flex-1">
              <h3 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-4">Operational Logs</h3>
              
              <div className="space-y-4">
                <div className="border border-border bg-primary p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-textPrimary flex items-center gap-1 uppercase tracking-wider"><Users className="size-3 text-textSecondary" /> System Auto-Routing</span>
                    <span className="text-[9px] text-textSecondary font-mono">10:45 AM</span>
                  </div>
                  <p className="text-xs text-textSecondary">Assigned incident to {incident.department || 'GHMC Department'} based on LLM classification.</p>
                </div>
                
                <div className="border border-border bg-primary p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-textPrimary flex items-center gap-1 uppercase tracking-wider"><MessageSquare className="size-3 text-textSecondary" /> Dispatcher Note</span>
                    <span className="text-[9px] text-textSecondary font-mono">10:48 AM</span>
                  </div>
                  <p className="text-xs text-textSecondary">Units have been notified. Awaiting ETA confirmation from field teams.</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <input type="text" placeholder="Add operational log..." className="w-full bg-primary border border-border p-3 text-[10px] font-mono uppercase tracking-widest text-textPrimary focus:outline-none focus:border-info transition-colors" />
              </div>
            </div>
          </section>

        </div>
      </div>
    </RootLayout>
  )
}
