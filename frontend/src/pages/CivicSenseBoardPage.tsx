import { useState, useEffect } from 'react'
import { RootLayout } from '@/components/layout/RootLayout'
import { Activity, Map as MapIcon, BarChart3, Clock, MapPin, Building, ShieldCheck, ArrowRight } from 'lucide-react'
import { api } from '@/lib/api'
import { useIncidentWebSocket } from '@/hooks/useWebSocket'

type Incident = {
  id: string
  title: string
  description: string
  category: string
  severity: string
  ward?: string
  department?: string
  latitude: number
  longitude: number
  image_path: string
  status: string
  created_at: string
  is_civic_issue?: boolean
  ai_summary?: string
  ai_risk_level?: string
}

function CivicSenseContext({ incidents }: { incidents: Incident[] }) {
  const latest = incidents.length > 0 ? incidents[0] : null
  const ward = latest?.ward || 'Unknown Ward'
  const dept = latest?.department || 'Unassigned Department'
  const officerBadge = 'Unassigned'

  return (
    <div className="flex flex-col h-full bg-panel">
      <div className="p-4 border-b border-border bg-[#1A202C]">
        <h3 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest flex items-center gap-2">
          <MapPin className="size-3" /> Ward Information
        </h3>
      </div>
      
      <div className="p-4 space-y-6 flex-1 overflow-y-auto">
        
        <div>
          <h4 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-2">Selected Sector</h4>
          <div className="bg-primary border border-border p-3">
            <span className="text-sm font-bold text-textPrimary block">Ward {ward}</span>
            <span className="text-[10px] text-textSecondary font-mono uppercase tracking-wider block mt-1">Zone: Derived from Ward</span>
          </div>
        </div>

        <div>
          <h4 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-2">Responsible Dept</h4>
          <div className="bg-primary border border-border p-3 flex gap-3 items-center">
            <Building className="size-5 text-info" />
            <div>
              <span className="text-xs font-bold text-textPrimary block">{dept}</span>
              <span className="text-[10px] text-textSecondary font-mono uppercase tracking-wider">Contact: Direct</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-2">Assigned Officer</h4>
          <div className="bg-primary border border-border p-3 flex gap-3 items-center">
            <ShieldCheck className="size-5 text-resolved" />
            <div>
              <span className="text-xs font-bold text-textPrimary block">Officer Status</span>
              <span className="text-[10px] text-textSecondary font-mono uppercase tracking-wider">ID: {officerBadge}</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-2">Previous Reports</h4>
          <div className="space-y-2">
            {incidents.filter(inc => inc.status === 'resolved').slice(0, 3).map((inc) => (
              <div key={inc.id} className="border-l-2 border-border bg-primary p-2 pl-3">
                <span className="text-[10px] font-bold text-textPrimary block">{inc.title}</span>
                <span className="text-[9px] text-textSecondary font-mono uppercase mt-0.5 block flex items-center gap-1">
                  <Clock className="size-2" /> Resolved
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

export function CivicSenseBoardPage() {
  const [activeTab, setActiveTab] = useState<'feed' | 'map' | 'analytics'>('feed')
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const lastUpdate = useIncidentWebSocket()

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get<{ items: Incident[] }>('/dashboard/incidents')
        setIncidents(data.items)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [lastUpdate])

  return (
    <RootLayout rightPanel={<CivicSenseContext incidents={incidents} />}>
      <div className="flex-1 overflow-hidden flex flex-col p-4 lg:p-6 h-full">
        <div className="max-w-[1200px] w-full flex-1 flex flex-col space-y-4">
          
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-4 shrink-0">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight text-textPrimary">Civic Sense</h1>
              <p className="text-xs font-bold text-textSecondary uppercase tracking-widest mt-1">Operational Citizen Report Feed</p>
            </div>
            
            <div className="flex gap-1 bg-panel border border-border p-1 rounded-none">
              <button 
                onClick={() => setActiveTab('feed')}
                className={`px-4 py-1.5 text-[10px] font-bold uppercase flex items-center gap-2 ${activeTab === 'feed' ? 'bg-[#30363D] text-textPrimary' : 'text-textSecondary hover:bg-[#30363D]/50 hover:text-textPrimary'}`}
              >
                <Activity className="size-3" /> Live Feed
              </button>
              <button 
                onClick={() => setActiveTab('map')}
                className={`px-4 py-1.5 text-[10px] font-bold uppercase flex items-center gap-2 ${activeTab === 'map' ? 'bg-[#30363D] text-textPrimary' : 'text-textSecondary hover:bg-[#30363D]/50 hover:text-textPrimary'}`}
              >
                <MapIcon className="size-3" /> Spatial Map
              </button>
              <button 
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-1.5 text-[10px] font-bold uppercase flex items-center gap-2 ${activeTab === 'analytics' ? 'bg-[#30363D] text-textPrimary' : 'text-textSecondary hover:bg-[#30363D]/50 hover:text-textPrimary'}`}
              >
                <BarChart3 className="size-3" /> Analytics
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-hidden relative">
            {/* LIVE FEED TAB */}
            {activeTab === 'feed' && (
              <div className="absolute inset-0 flex flex-col gap-4 pr-2 overflow-y-auto pb-12">
                {loading && <div className="text-[10px] font-mono text-textSecondary uppercase p-4">Loading operational feed...</div>}
                
                {!loading && incidents.map((inc) => (
                  <div key={inc.id} className="panel p-0 flex flex-col hover:border-textSecondary transition-colors">
                    <div className="flex items-stretch border-b border-border bg-[#1A202C]">
                      <div className="w-32 shrink-0 border-r border-border bg-black relative">
                        <img src={inc.image_path} alt={inc.title} className="w-full h-full object-cover opacity-70 grayscale hover:grayscale-0 transition-all" />
                      </div>
                      
                      <div className="flex-1 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider ${inc.severity === 'Critical' ? 'bg-critical/10 text-critical border border-critical/20' : inc.severity === 'High' ? 'bg-high/10 text-high border border-high/20' : 'bg-medium/10 text-medium border border-medium/20'}`}>{inc.severity} Priority</span>
                            <span className="text-[10px] text-textSecondary font-mono uppercase tracking-widest">{inc.id.split('-')[0]}</span>
                          </div>
                          <span className="text-[9px] text-textSecondary font-mono uppercase flex items-center gap-1"><Clock className="size-2" /> {new Date(inc.created_at).toLocaleString()}</span>
                        </div>
                        <h3 className="text-sm font-bold text-textPrimary mb-1">{inc.title}</h3>
                        
                        <div className="border-l-2 border-info pl-2 py-0.5 mb-2 mt-2">
                          <p className="text-[10px] text-textPrimary leading-relaxed">
                            <span className="text-info font-bold uppercase tracking-wider mr-1 text-[9px]">AI Risk:</span>
                            {inc.ai_risk_level || 'Pending Assessment'}
                          </p>
                          <p className="text-[10px] text-textPrimary leading-relaxed mt-1">
                            <span className="text-info font-bold uppercase tracking-wider mr-1 text-[9px]">Summary:</span>
                            {inc.ai_summary || inc.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-primary p-3 flex items-center justify-between">
                      <div className="flex gap-6">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[8px] font-bold text-textSecondary uppercase tracking-widest">Ward</span>
                          <span className="text-[10px] font-mono text-textPrimary">{inc.ward || 'Unknown'}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[8px] font-bold text-textSecondary uppercase tracking-widest">Department</span>
                          <span className="text-[10px] font-mono text-textPrimary">{inc.department || 'Unassigned'}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[8px] font-bold text-textSecondary uppercase tracking-widest">Status</span>
                          <span className="text-[10px] font-mono text-high">{inc.status}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button className="bg-panel border border-border text-textPrimary px-3 py-1 text-[9px] font-bold uppercase tracking-widest hover:bg-[#30363D] transition-colors">Acknowledge</button>
                        <button onClick={() => window.location.href = `/incidents/${inc.id}`} className="bg-info/10 border border-info/30 text-info px-3 py-1 text-[9px] font-bold uppercase tracking-widest hover:bg-info hover:text-white transition-colors flex items-center gap-1">
                          Escalate <ArrowRight className="size-2.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* MAP TAB */}
            {activeTab === 'map' && (
              <div className="absolute inset-0 bg-primary border border-border flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://maps.wikimedia.org/osm-intl/12/2927/1825.png')] bg-cover bg-center opacity-20 grayscale"></div>
                <div className="relative z-10 text-center bg-panel border border-border p-6 shadow-xl">
                  <MapIcon className="size-8 text-textSecondary mx-auto mb-3" />
                  <h2 className="text-sm font-bold uppercase tracking-widest text-textPrimary">Spatial Issue Tracker</h2>
                  <p className="text-[10px] text-textSecondary mt-2 max-w-xs font-mono">Geospatial cluster view is currently active. Showing data for Kukatpally and Madhapur zones.</p>
                </div>
              </div>
            )}

            {/* ANALYTICS TAB */}
            {activeTab === 'analytics' && (
              <div className="absolute inset-0 overflow-y-auto space-y-6 pb-12">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="panel p-4">
                    <h3 className="text-[9px] font-bold uppercase tracking-widest text-textSecondary mb-2">Total Reports (24h)</h3>
                    <p className="text-2xl font-black text-textPrimary">{incidents.length}</p>
                  </div>
                  <div className="panel p-4">
                    <h3 className="text-[9px] font-bold uppercase tracking-widest text-textSecondary mb-2">Most Frequent Issue</h3>
                    <p className="text-lg font-black text-high">{incidents[0]?.category || 'N/A'}</p>
                  </div>
                  <div className="panel p-4">
                    <h3 className="text-[9px] font-bold uppercase tracking-widest text-textSecondary mb-2">Active Issues</h3>
                    <p className="text-2xl font-black text-textPrimary">{incidents.filter(i => i.status !== 'resolved').length}</p>
                  </div>
                </div>

                <div className="panel p-5 h-48 flex flex-col">
                  <h3 className="text-[9px] font-bold uppercase tracking-widest text-textSecondary mb-4">Trend: Operations Over Time</h3>
                  <div className="flex-1 flex items-end gap-1 border-b border-border pb-1">
                    {incidents.slice(0, 12).map((inc, i) => (
                      <div key={inc.id} className="flex-1 bg-info/50 hover:bg-info transition-colors" style={{ height: `${Math.max(10, (12 - i) * 8)}%` }}></div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </RootLayout>
  )
}
