import { RootLayout } from '@/components/layout/RootLayout'
import { Truck, Settings2, AlertTriangle, ShieldCheck, Cpu, Droplets, Flame, Package } from 'lucide-react'

const resources = [
  { name: 'Municipal Sanitation', total: 45, active: 38, icon: Truck, color: 'text-info' },
  { name: 'HMWSSB Repair', total: 12, active: 11, icon: Droplets, color: 'text-medium' },
  { name: 'Traffic Police', total: 80, active: 65, icon: ShieldCheck, color: 'text-high' },
  { name: 'TFS Fire Engines', total: 24, active: 4, icon: Flame, color: 'text-critical' },
]

export function ResourceManagementPage() {
  const RightContextPanel = (
    <div className="flex flex-col h-full bg-panel text-textPrimary">
      <div className="p-4 border-b border-border bg-[#1A202C]">
        <h3 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest flex items-center gap-2">
          <Package className="size-3" /> Depot Availability
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <h4 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-3">Secunderabad Hub</h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center bg-primary border border-border p-2">
              <span className="text-textPrimary font-bold">Ambulances</span>
              <span className="text-resolved font-mono">14 Available</span>
            </div>
            <div className="flex justify-between items-center bg-primary border border-border p-2">
              <span className="text-textPrimary font-bold">Heavy Cranes</span>
              <span className="text-critical font-mono">0 Available</span>
            </div>
            <div className="flex justify-between items-center bg-primary border border-border p-2">
              <span className="text-textPrimary font-bold">Patrol Vehicles</span>
              <span className="text-info font-mono">8 Available</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-3">Kukatpally Depot</h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center bg-primary border border-border p-2">
              <span className="text-textPrimary font-bold">Fire Engines</span>
              <span className="text-medium font-mono">3 Available</span>
            </div>
            <div className="flex justify-between items-center bg-primary border border-border p-2">
              <span className="text-textPrimary font-bold">Water Tankers</span>
              <span className="text-resolved font-mono">12 Available</span>
            </div>
          </div>
        </div>
        
        <button className="w-full bg-info/10 border border-info/30 hover:bg-info text-info hover:text-white py-2 text-[9px] font-bold uppercase tracking-widest transition-colors mt-4">
          Request Inter-Depot Transfer
        </button>
      </div>
    </div>
  )

  return (
    <RootLayout rightPanel={RightContextPanel}>
      <div className="p-6 max-w-6xl mx-auto space-y-8">
        
        <header className="border-b border-border pb-4 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-textPrimary flex items-center gap-3">
              Resource Command
            </h1>
            <p className="text-xs font-bold text-textSecondary uppercase tracking-widest mt-1">Live Deployment & Personnel Tracking</p>
          </div>
          <div className="flex gap-2">
            <button className="bg-panel border border-border hover:bg-[#30363D] text-textPrimary px-4 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors">
              <Settings2 className="size-3" /> Allocation Rules
            </button>
          </div>
        </header>

        <div className="grid lg:grid-cols-4 gap-6">
          
          {/* Operational Resource Cards */}
          {resources.map(res => (
            <div key={res.name} className="panel p-5 group cursor-pointer hover:border-textSecondary transition-colors" onClick={() => window.location.href = '/incidents/INC-890'}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <res.icon className={`size-4 ${res.color}`} />
                  <h3 className="text-[10px] font-bold text-textPrimary uppercase tracking-widest leading-tight">{res.name}</h3>
                </div>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-textPrimary">{res.active}</span>
                <span className="text-[10px] font-mono text-textSecondary mb-1 uppercase tracking-widest">/ {res.total} Active</span>
              </div>
              <div className="mt-4 w-full h-1 bg-border overflow-hidden">
                <div className={`h-full ${res.color.replace('text-', 'bg-')}`} style={{ width: `${(res.active / res.total) * 100}%` }}></div>
              </div>
              <button className="w-full mt-4 bg-primary border border-border text-textPrimary py-1.5 text-[9px] font-bold uppercase tracking-widest group-hover:bg-[#30363D] transition-colors">
                Assign Unit
              </button>
            </div>
          ))}

          {/* AI Optimization Insights */}
          <div className="lg:col-span-2 bg-info/5 border border-info/20 p-5 flex flex-col">
            <h3 className="text-[10px] font-bold text-info uppercase tracking-widest mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2"><Cpu className="size-3" /> AI Fleet Recommendations</span>
              <button className="text-[9px] border border-info/30 bg-info/10 text-info font-bold px-3 py-1 uppercase tracking-widest hover:bg-info hover:text-white transition-colors">Execute Strategy</button>
            </h3>
            <div className="flex-1 flex flex-col justify-center space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="size-4 text-medium shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-textPrimary">HMWSSB Capacity Warning</h4>
                  <p className="text-[10px] text-textSecondary mt-1 leading-relaxed font-mono">91% of repair units are actively deployed. The AI models predict a surge in water leakage reports in Secunderabad over the next 4 hours based on pressure telemetry. Consider preemptive staging.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="size-4 text-resolved shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-textPrimary">Traffic Routing Optimized</h4>
                  <p className="text-[10px] text-textSecondary mt-1 leading-relaxed font-mono">Traffic police deployments in Gachibowli have been dynamically shifted to alleviate congestion from INC-890. Estimated delay reduced by 14 minutes.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Department Active Units Table */}
          <div className="lg:col-span-2 panel flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border bg-[#1A202C] flex justify-between items-center">
              <h3 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest">Active Dispatch Log</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-primary text-[9px] text-textSecondary uppercase tracking-widest border-b border-border">
                  <tr>
                    <th className="p-3 font-bold">Unit ID</th>
                    <th className="p-3 font-bold">Department</th>
                    <th className="p-3 font-bold">Assignment</th>
                    <th className="p-3 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr className="hover:bg-[#30363D] transition-colors cursor-pointer" onClick={() => window.location.href = '/incidents/INC-811'}>
                    <td className="p-3 font-mono text-info text-[10px]">U-1042</td>
                    <td className="p-3 text-textPrimary font-bold">Municipal Sanitation</td>
                    <td className="p-3 text-textSecondary font-mono text-[10px]">INC-811 (Charminar)</td>
                    <td className="p-3"><span className="border border-high/30 bg-high/10 text-high text-[9px] font-bold px-2 py-0.5 uppercase tracking-widest">En Route</span></td>
                  </tr>
                  <tr className="hover:bg-[#30363D] transition-colors cursor-pointer" onClick={() => window.location.href = '/incidents/INC-891'}>
                    <td className="p-3 font-mono text-info text-[10px]">U-2219</td>
                    <td className="p-3 text-textPrimary font-bold">HMWSSB</td>
                    <td className="p-3 text-textSecondary font-mono text-[10px]">INC-891 (Madhapur)</td>
                    <td className="p-3"><span className="border border-resolved/30 bg-resolved/10 text-resolved text-[9px] font-bold px-2 py-0.5 uppercase tracking-widest">On Scene</span></td>
                  </tr>
                  <tr className="hover:bg-[#30363D] transition-colors cursor-pointer" onClick={() => window.location.href = '/incidents/INC-890'}>
                    <td className="p-3 font-mono text-info text-[10px]">U-0991</td>
                    <td className="p-3 text-textPrimary font-bold">Traffic Police</td>
                    <td className="p-3 text-textSecondary font-mono text-[10px]">INC-890 (Gachibowli)</td>
                    <td className="p-3"><span className="border border-resolved/30 bg-resolved/10 text-resolved text-[9px] font-bold px-2 py-0.5 uppercase tracking-widest">On Scene</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </RootLayout>
  )
}
