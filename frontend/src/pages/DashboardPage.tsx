import { useNavigate } from 'react-router-dom'
import { RootLayout } from '@/components/layout/RootLayout'
import { AlertCircle, Clock, CheckCircle2, AlertTriangle, Truck, Crosshair, Users, Activity, BarChart2 } from 'lucide-react'

const criticalAlerts = [
  { id: 'ALT-1', type: 'Evacuation Required', location: 'Secunderabad Zone 4', time: 'Just now' },
  { id: 'ALT-2', type: 'HMWSSB Unit Offline', location: 'Kukatpally Depot', time: '5m ago' },
]

const dispatchQueue = [
  { id: 'INC-892', type: 'Building Collapse', priority: 'Critical', assignedTo: 'Telangana Fire Services', eta: '4 mins' },
  { id: 'INC-891', type: 'Severe Water Leakage', priority: 'High', assignedTo: 'HMWSSB', eta: '12 mins' },
  { id: 'INC-890', type: 'Road Accident', priority: 'High', assignedTo: 'Hyderabad Traffic Police', eta: 'Arrived' },
]

const aiDecisions = [
  { time: '10:45 AM', action: 'Routed INC-892 to Fire Services based on YOLOv11 structural damage detection.' },
  { time: '10:42 AM', action: 'Auto-escalated INC-891 priority to High due to proximity to main electrical grid.' },
  { time: '10:35 AM', action: 'Flagged duplicate reports for Pothole at Jubilee Hills Rd No 36.' },
]

const officerAssignments = [
  { officer: 'K. Rao', badge: 'TFS-89', status: 'On Scene', incident: 'INC-890' },
  { officer: 'S. Reddy', badge: 'HTP-11', status: 'En Route', incident: 'INC-892' },
  { officer: 'M. Ali', badge: 'GHMC-44', status: 'Available', incident: '--' },
]

export function DashboardPage() {
  const navigate = useNavigate()

  return (
    <RootLayout>
      <div className="p-6 max-w-[1600px] mx-auto space-y-8">
        
        <header className="border-b border-border pb-4">
          <h1 className="text-3xl font-black uppercase tracking-tight text-textPrimary">Command Center</h1>
          <p className="text-xs font-bold text-textSecondary uppercase tracking-widest mt-1">Active Response & Dispatch Coordination</p>
        </header>

        {/* Lightweight Operational Analytics */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="panel p-4 flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-textSecondary mb-2 flex items-center gap-1">
              <Clock className="size-3 text-info" /> Avg Response Time
            </span>
            <div className="text-2xl font-bold text-textPrimary">14m 22s</div>
          </div>
          <div className="panel p-4 flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-textSecondary mb-2 flex items-center gap-1">
              <Truck className="size-3 text-resolved" /> Units Active
            </span>
            <div className="text-2xl font-bold text-textPrimary">42 / 120</div>
          </div>
          <div className="panel p-4 flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-textSecondary mb-2 flex items-center gap-1">
              <Activity className="size-3 text-medium" /> Pending Dispatches
            </span>
            <div className="text-2xl font-bold text-textPrimary">8</div>
          </div>
          <div className="panel p-4 flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-textSecondary mb-2 flex items-center gap-1">
              <AlertTriangle className="size-3 text-critical" /> Critical Incidents
            </span>
            <div className="text-2xl font-bold text-critical">3</div>
          </div>
        </section>

        {/* Critical Alerts Row */}
        {criticalAlerts.length > 0 && (
          <section className="bg-critical/10 border border-critical/30 p-4 flex flex-col md:flex-row gap-4 items-center">
            <div className="flex items-center gap-3 shrink-0">
              <AlertTriangle className="size-6 text-critical animate-pulse" />
              <div>
                <h3 className="text-critical font-bold uppercase tracking-wider text-sm">Critical Alerts</h3>
                <p className="text-[10px] text-critical/80 uppercase">Immediate Intervention Required</p>
              </div>
            </div>
            <div className="w-px h-8 bg-critical/20 hidden md:block"></div>
            <div className="flex-1 grid md:grid-cols-2 gap-3 w-full">
              {criticalAlerts.map(alt => (
                <div key={alt.id} className="bg-primary/50 border border-critical/30 p-2 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-critical block">{alt.type}</span>
                    <span className="text-[10px] text-textSecondary font-mono">{alt.location}</span>
                  </div>
                  <span className="text-[10px] text-textSecondary font-mono">{alt.time}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid lg:grid-cols-12 gap-6">
          
          {/* Left Col: Dispatch Queue */}
          <section className="lg:col-span-5 flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase text-textSecondary flex items-center gap-2">
              <Crosshair className="size-4 text-high" /> Live Dispatch Queue
            </h3>
            <div className="space-y-3">
              {dispatchQueue.map((q, i) => (
                <div key={i} className="panel p-3 group cursor-pointer hover:border-textSecondary transition-colors" onClick={() => navigate('/resources')}>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wider ${q.priority === 'Critical' ? 'bg-critical/10 text-critical border border-critical/20' : 'bg-high/10 text-high border border-high/20'}`}>{q.priority}</span>
                    <span className="text-[10px] font-mono text-textSecondary">{q.id}</span>
                  </div>
                  <p className="text-sm font-bold text-textPrimary group-hover:text-info transition-colors">{q.type}</p>
                  <div className="flex justify-between items-end mt-3">
                    <span className="text-[10px] text-textSecondary flex items-center gap-1 font-mono uppercase"><Truck className="size-3" /> {q.assignedTo}</span>
                    <span className="text-[10px] font-bold text-info bg-info/10 px-2 py-1 uppercase tracking-widest cursor-pointer hover:bg-info hover:text-white transition-colors border border-info/20">Allocate</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Center Col: AI Decisions & Progress */}
          <section className="lg:col-span-4 flex flex-col gap-6">
            <div>
              <h3 className="text-xs font-bold uppercase text-textSecondary flex items-center gap-2 mb-4">
                <Activity className="size-4 text-info" /> AI Routing Decisions
              </h3>
              <div className="space-y-4">
                {aiDecisions.map((dec, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-[10px] font-bold text-textSecondary shrink-0 w-14 font-mono">{dec.time}</span>
                    <p className="text-xs text-textPrimary border-l-2 border-border pl-3 py-0.5 leading-relaxed">{dec.action}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel p-4">
              <h3 className="text-xs font-bold uppercase text-textSecondary flex items-center gap-2 mb-4">
                <CheckCircle2 className="size-4 text-resolved" /> Response Progress
              </h3>
              <div className="space-y-4 text-xs font-mono uppercase tracking-wide">
                <div>
                  <div className="flex justify-between mb-1"><span className="text-textSecondary">Active Incidents (12)</span><span className="font-bold text-textPrimary">35% Resolved</span></div>
                  <div className="w-full bg-border h-1"><div className="bg-resolved h-1 w-[35%]"></div></div>
                </div>
                <div>
                  <div className="flex justify-between mb-1"><span className="text-textSecondary">SLA Compliance</span><span className="font-bold text-textPrimary">92%</span></div>
                  <div className="w-full bg-border h-1"><div className="bg-info h-1 w-[92%]"></div></div>
                </div>
              </div>
            </div>
          </section>

          {/* Right Col: Active Assignments */}
          <section className="lg:col-span-3 flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase text-textSecondary flex items-center gap-2">
              <Users className="size-4 text-purple-400" /> Active Assignments
            </h3>
            <div className="panel overflow-hidden">
              <div className="grid grid-cols-4 text-[9px] font-bold text-textSecondary uppercase tracking-widest p-3 border-b border-border bg-[#1A202C]">
                <span className="col-span-2">Officer</span>
                <span>Status</span>
                <span className="text-right">Unit</span>
              </div>
              <div className="divide-y divide-border">
                {officerAssignments.map((off, i) => (
                  <div key={i} className="grid grid-cols-4 items-center p-3 text-xs bg-primary hover:bg-[#1A202C] transition-colors cursor-pointer">
                    <div className="col-span-2">
                      <span className="block font-bold text-textPrimary">{off.officer}</span>
                      <span className="text-[10px] text-textSecondary font-mono">{off.badge}</span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${off.status === 'On Scene' ? 'text-resolved' : off.status === 'En Route' ? 'text-info' : 'text-textSecondary'}`}>{off.status}</span>
                    <span className="text-right font-mono text-textSecondary text-[10px]">{off.incident}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>
      </div>
    </RootLayout>
  )
}
