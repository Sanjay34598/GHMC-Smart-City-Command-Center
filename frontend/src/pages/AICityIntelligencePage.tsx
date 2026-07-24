import { useState, useEffect } from 'react'
import { RootLayout } from '@/components/layout/RootLayout'
import { 
  Sparkles, 
  ShieldCheck, 
  Car, 
  Trash2, 
  AlertTriangle, 
  Droplets, 
  Activity, 
  Wind, 
  Zap, 
  HeartHandshake, 
  Building2, 
  Briefcase, 
  Compass, 
  TrendingUp, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock
} from 'lucide-react'
import { getDashboardStats, getDashboardIncidents } from '@/lib/dashboard'
import type { DashboardStats, DashboardIncident } from '@/lib/dashboard'

function CityIntelligenceContext({ stats }: { stats: DashboardStats | null }) {
  return (
    <div className="flex flex-col h-full bg-panel text-textPrimary">
      <div className="p-4 border-b border-border bg-[#1A202C]">
        <h3 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest flex items-center gap-2">
          <Sparkles className="size-3 text-info" /> AI Executive Summary
        </h3>
      </div>
      
      <div className="p-4 space-y-6 flex-1 overflow-y-auto font-mono text-xs">
        <div>
          <h4 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-2">Primary Index</h4>
          <div className="bg-primary border border-border p-3">
            <span className="text-2xl font-black text-resolved block">91.8 / 100</span>
            <span className="text-[9px] text-textSecondary uppercase tracking-wider block mt-1">Smart City Readiness Score</span>
          </div>
        </div>

        <div>
          <h4 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-2">Live Incident Data Basis</h4>
          <div className="bg-primary border border-border p-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-textSecondary">Sampled Incidents:</span>
              <span className="font-bold text-textPrimary">{stats?.total ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-textSecondary">Resolved Ratio:</span>
              <span className="font-bold text-resolved">{stats?.total ? Math.round(((stats.resolved ?? 0) / stats.total) * 100) : 100}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-textSecondary">Critical Count:</span>
              <span className="font-bold text-critical">{stats?.critical ?? 0}</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-[10px] font-bold text-info uppercase tracking-widest mb-2">Strategic Verdict</h4>
          <div className="border-l-2 border-info bg-primary p-3 space-y-1.5">
            <p className="text-xs font-bold text-textPrimary">Highly Favorable for Investment &amp; Living</p>
            <p className="text-[10px] text-textSecondary leading-relaxed">
              Municipal response SLA compliance is high. Risk clusters are strictly localized in Ward 108 &amp; Madhapur sector, leaving residential hubs stable.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AICityIntelligencePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [incidents, setIncidents] = useState<DashboardIncident[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, incidentsRes] = await Promise.all([
          getDashboardStats(),
          getDashboardIncidents({ limit: 100 })
        ])
        setStats(statsRes)
        setIncidents(incidentsRes.items)
      } catch (e) {
        console.error('Failed to load intelligence data:', e)
      } finally {
        setLoading(false)
      }
    }
    void loadData()
  }, [])

  // Derived Realistic Scores from Backend Data
  const total = stats?.total || incidents.length || 1
  const critical = stats?.critical || incidents.filter(i => i.severity === 'Critical').length
  const resolved = stats?.resolved || incidents.filter(i => i.status === 'resolved').length
  
  const safetyScore = Math.max(60, Math.min(98, 100 - (critical * 4)))
  const trafficIncidents = incidents.filter(i => i.category === 'Accident' || i.category === 'Road Block' || i.category === 'Illegal Parking').length
  const trafficScore = Math.max(65, Math.min(96, 100 - (trafficIncidents * 3)))
  const cleanlinessIncidents = incidents.filter(i => i.category === 'Garbage Overflow' || i.category === 'Water Leak').length
  const cleanlinessScore = Math.max(70, Math.min(98, 100 - (cleanlinessIncidents * 3)))
  const emergencyResponseScore = Math.min(99, Math.round((resolved / total) * 100) || 94)
  const floodIncidents = incidents.filter(i => i.category === 'Flood').length
  const floodRiskScore = Math.max(70, 100 - (floodIncidents * 8))
  const overallCityScore = Math.round((safetyScore + trafficScore + cleanlinessScore + emergencyResponseScore) / 4)

  // Safe Areas & Attention Areas from Ward Distribution
  const wardCounts: Record<string, number> = {}
  incidents.forEach(inc => {
    const ward = inc.ward || 'General Sector'
    wardCounts[ward] = (wardCounts[ward] || 0) + 1
  })

  const sortedWards = Object.entries(wardCounts).sort((a, b) => b[1] - a[1])
  const attentionAreas = sortedWards.slice(0, 3).map(([ward, count]) => ({ ward, count }))
  const safeAreas = sortedWards.length > 3 
    ? sortedWards.slice(-3).map(([ward, count]) => ({ ward, count }))
    : [
        { ward: 'Ward 42 · Banjara Hills', count: 1 },
        { ward: 'Ward 88 · Jubliee Hills', count: 1 },
        { ward: 'Ward 12 · Hitec City Central', count: 2 }
      ]

  return (
    <RootLayout rightPanel={<CityIntelligenceContext stats={stats} />}>
      <div className="p-6 max-w-[1400px] mx-auto space-y-8">
        
        {/* HEADER */}
        <header className="border-b border-border pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-textPrimary flex items-center gap-3">
              <Sparkles className="size-6 text-info" /> AI City Intelligence
            </h1>
            <p className="text-xs font-bold text-textSecondary uppercase tracking-widest mt-1">
              &quot;Should someone live, work, travel or invest in this city?&quot;
            </p>
          </div>
          <div className="flex gap-2">
            <span className="bg-info/10 border border-info/30 text-info px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest font-mono flex items-center gap-1.5">
              <Activity className="size-3 animate-pulse" /> Live Telemetry Feed
            </span>
          </div>
        </header>

        {/* 1. DECISION ENGINE: SHOULD SOMEONE LIVE, WORK, TRAVEL OR INVEST? */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-textSecondary flex items-center gap-2">
            <Compass className="size-4 text-info" /> Primary Location Decisions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* LIVE */}
            <div className="panel p-5 bg-[#161B22] border-l-4 border-l-resolved flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-textSecondary flex items-center gap-1.5">
                    <Building2 className="size-3.5 text-resolved" /> Live Here
                  </span>
                  <span className="text-xs font-black text-resolved bg-resolved/10 px-2 py-0.5 border border-resolved/20 font-mono">92 / 100</span>
                </div>
                <h3 className="text-sm font-bold text-textPrimary mb-1">Strong Viability</h3>
                <p className="text-[10px] text-textSecondary leading-relaxed">
                  High residential stability, low crime density in primary wards, and prompt municipal SLA responses.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[9px] font-mono text-resolved uppercase font-bold">
                <span>Verdict: Recommended</span>
                <ArrowUpRight className="size-3" />
              </div>
            </div>

            {/* WORK */}
            <div className="panel p-5 bg-[#161B22] border-l-4 border-l-info flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-textSecondary flex items-center gap-1.5">
                    <Briefcase className="size-3.5 text-info" /> Work Here
                  </span>
                  <span className="text-xs font-black text-info bg-info/10 px-2 py-0.5 border border-info/20 font-mono">95 / 100</span>
                </div>
                <h3 className="text-sm font-bold text-textPrimary mb-1">Excellent Ecosystem</h3>
                <p className="text-[10px] text-textSecondary leading-relaxed">
                  Commercial corridors feature high power grid reliability (99.2%) and active transport patrol routes.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[9px] font-mono text-info uppercase font-bold">
                <span>Verdict: Recommended</span>
                <ArrowUpRight className="size-3" />
              </div>
            </div>

            {/* TRAVEL */}
            <div className="panel p-5 bg-[#161B22] border-l-4 border-l-medium flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-textSecondary flex items-center gap-1.5">
                    <Compass className="size-3.5 text-medium" /> Travel Here
                  </span>
                  <span className="text-xs font-black text-medium bg-medium/10 px-2 py-0.5 border border-medium/20 font-mono">84 / 100</span>
                </div>
                <h3 className="text-sm font-bold text-textPrimary mb-1">Moderate Caution</h3>
                <p className="text-[10px] text-textSecondary leading-relaxed">
                  Low-elevation drainage spots in Sector 4 require weather advisories during intense rainfall.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[9px] font-mono text-medium uppercase font-bold">
                <span>Verdict: Plan Routines</span>
                <ArrowUpRight className="size-3" />
              </div>
            </div>

            {/* INVEST */}
            <div className="panel p-5 bg-[#161B22] border-l-4 border-l-resolved flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-textSecondary flex items-center gap-1.5">
                    <TrendingUp className="size-3.5 text-resolved" /> Invest Here
                  </span>
                  <span className="text-xs font-black text-resolved bg-resolved/10 px-2 py-0.5 border border-resolved/20 font-mono">96 / 100</span>
                </div>
                <h3 className="text-sm font-bold text-textPrimary mb-1">Highly Favorable</h3>
                <p className="text-[10px] text-textSecondary leading-relaxed">
                  AI-driven municipal dispatch lowers asset hazard risk and ensures rapid infrastructure recovery.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[9px] font-mono text-resolved uppercase font-bold">
                <span>Verdict: Prime Market</span>
                <ArrowUpRight className="size-3" />
              </div>
            </div>

          </div>
        </section>

        {/* 2. 10 CORE CITY INTELLIGENCE INDICATORS */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-textSecondary flex items-center gap-2">
            <Activity className="size-4 text-info" /> 10 Core City Intelligence Indicators
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            
            {/* 1. Overall City Score */}
            <div className="panel p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="size-3 text-info" /> Overall City Score
              </span>
              <div className="my-2">
                <span className="text-3xl font-black text-textPrimary">{overallCityScore}</span>
                <span className="text-xs font-mono text-textSecondary"> / 100</span>
              </div>
              <div className="w-full bg-border h-1">
                <div className="bg-info h-1" style={{ width: `${overallCityScore}%` }} />
              </div>
            </div>

            {/* 2. Safety Score */}
            <div className="panel p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="size-3 text-resolved" /> Safety Score
              </span>
              <div className="my-2">
                <span className="text-3xl font-black text-resolved">{safetyScore}</span>
                <span className="text-xs font-mono text-textSecondary"> / 100</span>
              </div>
              <div className="w-full bg-border h-1">
                <div className="bg-resolved h-1" style={{ width: `${safetyScore}%` }} />
              </div>
            </div>

            {/* 3. Traffic Score */}
            <div className="panel p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider flex items-center gap-1.5">
                <Car className="size-3 text-medium" /> Traffic Score
              </span>
              <div className="my-2">
                <span className="text-3xl font-black text-medium">{trafficScore}</span>
                <span className="text-xs font-mono text-textSecondary"> / 100</span>
              </div>
              <div className="w-full bg-border h-1">
                <div className="bg-medium h-1" style={{ width: `${trafficScore}%` }} />
              </div>
            </div>

            {/* 4. Cleanliness */}
            <div className="panel p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider flex items-center gap-1.5">
                <Trash2 className="size-3 text-info" /> Cleanliness
              </span>
              <div className="my-2">
                <span className="text-3xl font-black text-textPrimary">{cleanlinessScore}</span>
                <span className="text-xs font-mono text-textSecondary"> / 100</span>
              </div>
              <div className="w-full bg-border h-1">
                <div className="bg-info h-1" style={{ width: `${cleanlinessScore}%` }} />
              </div>
            </div>

            {/* 5. Emergency Response */}
            <div className="panel p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="size-3 text-resolved" /> Emergency Response
              </span>
              <div className="my-2">
                <span className="text-3xl font-black text-resolved">{emergencyResponseScore}%</span>
              </div>
              <div className="w-full bg-border h-1">
                <div className="bg-resolved h-1" style={{ width: `${emergencyResponseScore}%` }} />
              </div>
            </div>

            {/* 6. Flood Risk */}
            <div className="panel p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider flex items-center gap-1.5">
                <Droplets className="size-3 text-info" /> Flood Risk
              </span>
              <div className="my-2">
                <span className="text-2xl font-bold text-info">{floodRiskScore > 80 ? 'Low Risk' : 'Moderate'}</span>
                <span className="text-[10px] font-mono text-textSecondary block">Index: {floodRiskScore}/100</span>
              </div>
              <div className="w-full bg-border h-1">
                <div className="bg-info h-1" style={{ width: `${floodRiskScore}%` }} />
              </div>
            </div>

            {/* 7. Crime Trend */}
            <div className="panel p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="size-3 text-resolved" /> Crime Trend
              </span>
              <div className="my-2">
                <span className="text-2xl font-bold text-resolved">Decreasing</span>
                <span className="text-[10px] font-mono text-textSecondary block">-14% vs Last Quarter</span>
              </div>
              <div className="w-full bg-border h-1">
                <div className="bg-resolved h-1" style={{ width: '86%' }} />
              </div>
            </div>

            {/* 8. Air Quality */}
            <div className="panel p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider flex items-center gap-1.5">
                <Wind className="size-3 text-resolved" /> Air Quality
              </span>
              <div className="my-2">
                <span className="text-3xl font-black text-resolved">54</span>
                <span className="text-[10px] font-mono text-textSecondary block">AQI · Good Range</span>
              </div>
              <div className="w-full bg-border h-1">
                <div className="bg-resolved h-1" style={{ width: '90%' }} />
              </div>
            </div>

            {/* 9. Water Availability */}
            <div className="panel p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider flex items-center gap-1.5">
                <Droplets className="size-3 text-info" /> Water Availability
              </span>
              <div className="my-2">
                <span className="text-3xl font-black text-textPrimary">96%</span>
                <span className="text-[10px] font-mono text-textSecondary block">Supply Network Stable</span>
              </div>
              <div className="w-full bg-border h-1">
                <div className="bg-info h-1" style={{ width: '96%' }} />
              </div>
            </div>

            {/* 10. Power & Citizen Sat. */}
            <div className="panel p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="size-3 text-resolved" /> Power &amp; Satisfaction
              </span>
              <div className="my-2">
                <span className="text-2xl font-bold text-resolved">99.2%</span>
                <span className="text-[10px] font-mono text-textSecondary block">Power Uptime · 91% Sat.</span>
              </div>
              <div className="w-full bg-border h-1">
                <div className="bg-resolved h-1" style={{ width: '99%' }} />
              </div>
            </div>

          </div>
        </section>

        {/* 3. SAFE AREAS VS ATTENTION AREAS & FORECAST */}
        <div className="grid lg:grid-cols-12 gap-6">
          
          {/* TOP SAFE AREAS */}
          <section className="lg:col-span-4 panel p-5 flex flex-col">
            <h3 className="text-xs font-bold uppercase tracking-widest text-textPrimary mb-4 flex items-center gap-2">
              <ShieldCheck className="size-4 text-resolved" /> Top Safe Areas
            </h3>
            <div className="space-y-3 flex-1">
              {safeAreas.map((item, i) => (
                <div key={i} className="bg-primary border border-border p-3 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-textPrimary block">{item.ward}</span>
                    <span className="text-[9px] text-textSecondary font-mono uppercase">Low Incident Density</span>
                  </div>
                  <span className="text-[10px] font-bold text-resolved bg-resolved/10 px-2 py-1 border border-resolved/20 font-mono">
                    {item.count} Active
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* AREAS REQUIRING ATTENTION */}
          <section className="lg:col-span-4 panel p-5 flex flex-col">
            <h3 className="text-xs font-bold uppercase tracking-widest text-textPrimary mb-4 flex items-center gap-2">
              <AlertTriangle className="size-4 text-critical" /> Areas Requiring Attention
            </h3>
            <div className="space-y-3 flex-1">
              {attentionAreas.map((item, i) => (
                <div key={i} className="bg-primary border border-border p-3 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-textPrimary block">{item.ward}</span>
                    <span className="text-[9px] text-textSecondary font-mono uppercase">Higher Report Cluster</span>
                  </div>
                  <span className="text-[10px] font-bold text-critical bg-critical/10 px-2 py-1 border border-critical/20 font-mono">
                    {item.count} Reports
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* RECENT IMPROVEMENTS & RISK FORECAST */}
          <section className="lg:col-span-4 panel p-5 flex flex-col bg-[#161B22]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-textPrimary mb-4 flex items-center gap-2">
              <TrendingUp className="size-4 text-info" /> Risk Forecast &amp; Improvements
            </h3>
            <div className="space-y-4 font-mono text-[10px] leading-relaxed flex-1">
              <div className="border-l-2 border-resolved pl-3">
                <span className="font-bold text-resolved uppercase block mb-0.5">• Drainage Infrastructure Completed</span>
                <span className="text-textSecondary">Waterlogging clearance time in Kukatpally reduced from 45 mins to 14 mins.</span>
              </div>
              <div className="border-l-2 border-info pl-3">
                <span className="font-bold text-info uppercase block mb-0.5">• AI Dispatch Response SLA</span>
                <span className="text-textSecondary">Average incident acknowledgment time citywide stands under 4.2 minutes.</span>
              </div>
              <div className="border-l-2 border-medium pl-3">
                <span className="font-bold text-medium uppercase block mb-0.5">• 48-Hour Monsoon Forecast</span>
                <span className="text-textSecondary">Expected 35mm precipitation. Pumps staged near central underpasses.</span>
              </div>
            </div>
          </section>

        </div>

      </div>
    </RootLayout>
  )
}
