import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { RootLayout } from '@/components/layout/RootLayout'
import { AlertCircle, Clock, CheckCircle2, AlertTriangle, Truck, Crosshair, Users, Activity, Map as MapIcon } from 'lucide-react'
import { getDashboardStats, getDashboardIncidents } from '@/lib/dashboard'
import type { DashboardStats, DashboardIncident } from '@/lib/dashboard'
import { getNotifications } from '@/lib/notifications'
import type { Notification } from '@/lib/notifications'
import { IncidentMap } from '@/components/dashboard/IncidentMap'
import { useIncidentWebSocket } from '@/hooks/useWebSocket'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts'

// ─── Derived Types ────────────────────────────────────────────────────────────

interface OfficerAssignment {
  officer: string
  badge: string
  status: string
  incident: string
}

interface CriticalAlert {
  id: string
  type: string
  location: string
  time: string
}

interface DispatchItem {
  id: string
  type: string
  priority: string
  assignedTo: string
  eta: string
}

interface AiDecision {
  time: string
  action: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatResponseTime(seconds: number | null): string {
  if (seconds == null || isNaN(seconds)) return 'N/A'
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}m ${s.toString().padStart(2, '0')}s`
}

function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function severityToPriority(severity: string): string {
  switch (severity?.toLowerCase()) {
    case 'critical': return 'Critical'
    case 'high':     return 'High'
    case 'medium':   return 'Medium'
    default:         return 'Low'
  }
}

/**
 * Derive officer-style rows from incidents that have an assigned department.
 * Since the backend doesn't expose a dedicated officer endpoint we synthesise
 * plausible rows from the incident list itself.
 */
function deriveAssignments(incidents: DashboardIncident[]): OfficerAssignment[] {
  const assigned = incidents.filter(inc => inc.department && inc.status !== 'resolved')
  const seen = new Set<string>()
  const rows: OfficerAssignment[] = []

  for (const inc of assigned) {
    const dept = inc.department ?? 'GHMC'
    if (seen.has(dept)) continue
    seen.add(dept)

    const statusMap: Record<string, string> = {
      active:     'On Scene',
      dispatched: 'En Route',
      pending:    'En Route',
    }
    const assignmentStatus = statusMap[inc.status?.toLowerCase()] ?? 'Available'

    // Build a deterministic badge from the id
    const badgeNumber = Array.from(inc.id).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 100
    const badge = dept.replace(/\s+/g, '').slice(0, 6).toUpperCase() + '-' + badgeNumber.toString().padStart(2, '0')

    rows.push({
      officer: dept,
      badge,
      status: assignmentStatus,
      incident: `INC-${inc.id.slice(0, 6).toUpperCase()}`,
    })

    if (rows.length >= 5) break
  }

  return rows
}

/**
 * Build AI-decision log entries from incidents that have ai_summary / ai_risk_level.
 * Falls back to a status-change message if no AI data is available.
 */
function deriveAiDecisions(incidents: DashboardIncident[]): AiDecision[] {
  return incidents
    .filter(inc => {
      const rec = inc as unknown as Record<string, unknown>
      return rec['ai_summary'] || rec['ai_reason'] || rec['ai_risk_level']
    })
    .slice(0, 5)
    .map(inc => {
      const ts = new Date(inc.updated_at || inc.created_at)
      const timeLabel = ts.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      const rec = inc as unknown as Record<string, string | null>
      const action = rec['ai_summary'] || rec['ai_reason'] || `AI Risk Level: ${rec['ai_risk_level']}`
      return { time: timeLabel, action: action as string }
    })
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const navigate = useNavigate()

  const [stats, setStats]                     = useState<DashboardStats | null>(null)
  const [incidents, setIncidents]             = useState<DashboardIncident[]>([])
  const [dispatchQueue, setDispatchQueue]     = useState<DispatchItem[]>([])
  const [criticalAlerts, setCriticalAlerts]   = useState<CriticalAlert[]>([])
  const [officerAssignments, setOfficerAssignments] = useState<OfficerAssignment[]>([])
  const [aiDecisions, setAiDecisions]         = useState<AiDecision[]>([])
  const [loading, setLoading]                 = useState(true)
  const [error, setError]                     = useState<string | null>(null)
  
  const lastUpdate = useIncidentWebSocket()

  const fetchAll = useCallback(async () => {
    try {
      const [statsData, incidentsData, notificationsData] = await Promise.all([
        getDashboardStats(),
        getDashboardIncidents({ limit: 20 }),
        getNotifications().catch(() => [] as Notification[]),
      ])

      // ── Stats ──
      setStats(statsData)
      setIncidents(incidentsData.items)

      // ── Dispatch Queue from dashboard incidents ──
      const queue: DispatchItem[] = incidentsData.items
        .filter(inc => inc.status !== 'resolved')
        .slice(0, 6)
        .map(inc => ({
          id:         `INC-${inc.id.slice(0, 6).toUpperCase()}`,
          type:       inc.title,
          priority:   severityToPriority(inc.severity),
          assignedTo: inc.department ?? 'Unassigned',
          eta:        inc.estimated_resolution
                        ? relativeTime(inc.estimated_resolution)
                        : 'Pending',
        }))
      setDispatchQueue(queue)

      // ── Officer Assignments derived from incidents ──
      setOfficerAssignments(deriveAssignments(incidentsData.items))

      // ── AI Decisions derived from incident data ──
      setAiDecisions(deriveAiDecisions(incidentsData.items))

      // ── Critical Alerts from notifications ──
      const alerts: CriticalAlert[] = notificationsData
        .filter(n => n.severity === 'critical' || n.severity === 'high')
        .slice(0, 4)
        .map(n => ({
          id:       n.id,
          type:     n.title,
          location: n.message,
          time:     relativeTime(n.created_at),
        }))

      // Fallback: if no critical notifications, derive from incidents
      if (alerts.length === 0) {
        incidentsData.items
          .filter(inc => inc.severity === 'critical')
          .slice(0, 4)
          .forEach(inc => {
            alerts.push({
              id:       inc.id,
              type:     inc.title,
              location: inc.ward ?? `${inc.latitude.toFixed(3)}, ${inc.longitude.toFixed(3)}`,
              time:     relativeTime(inc.created_at),
            })
          })
      }
      setCriticalAlerts(alerts)

      setError(null)
    } catch (err) {
      console.error('[DashboardPage] fetch error:', err)
      setError('Failed to load dashboard data. Retrying…')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch and WebSocket updates
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll()
  }, [fetchAll, lastUpdate])

  // ── Derived stat values ────────────────────────────────────────────────────
  const totalIncidents = stats?.total ?? incidents.length
  const criticalCount  = stats?.critical ?? incidents.filter(i => i.severity === 'Critical').length
  const pendingVerificationCount = stats?.pending_verification ?? incidents.filter(i => i.status === 'Pending Verification' || i.status === 'pending' || i.status === 'reported').length
  const resolvedCount  = stats?.resolved ?? incidents.filter(i => i.status === 'resolved').length
  const latestIncident = stats?.latest_incident ?? (incidents.length > 0 ? incidents[0] : null)

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <RootLayout>
        <div className="p-6 max-w-[1600px] mx-auto space-y-8">
          <header className="border-b border-border pb-4">
            <h1 className="text-3xl font-black uppercase tracking-tight text-textPrimary">Command Center</h1>
            <p className="text-xs font-bold text-textSecondary uppercase tracking-widest mt-1">Active Response &amp; Dispatch Coordination</p>
          </header>
          <div className="animate-pulse space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="panel p-4 h-20 bg-border/30" />
              ))}
            </div>
            <div className="h-16 bg-border/20" />
            <div className="grid lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="panel p-3 h-24 bg-border/20" />
                ))}
              </div>
              <div className="lg:col-span-4 space-y-6">
                <div className="h-48 bg-border/20" />
                <div className="panel p-4 h-32 bg-border/20" />
              </div>
              <div className="lg:col-span-3">
                <div className="panel h-48 bg-border/20" />
              </div>
            </div>
          </div>
        </div>
      </RootLayout>
    )
  }

  return (
    <RootLayout>
      <div className="p-6 max-w-[1600px] mx-auto space-y-8">
        
        <header className="border-b border-border pb-4">
          <h1 className="text-3xl font-black uppercase tracking-tight text-textPrimary">Command Center</h1>
          <p className="text-xs font-bold text-textSecondary uppercase tracking-widest mt-1">Active Response &amp; Dispatch Coordination</p>
        </header>

        {/* Error Banner */}
        {error && (
          <div className="bg-high/10 border border-high/30 p-3 flex items-center gap-3 text-xs text-high font-mono">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        )}

        {/* FEATURE 5: Integrated Dashboard Metrics */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="panel p-4 flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-textSecondary mb-2 flex items-center gap-1">
              <Truck className="size-3 text-info" /> Total Incidents
            </span>
            <div className="text-2xl font-bold text-textPrimary">{totalIncidents}</div>
          </div>
          <div className="panel p-4 flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-textSecondary mb-2 flex items-center gap-1">
              <AlertTriangle className="size-3 text-critical" /> Critical Count
            </span>
            <div className="text-2xl font-bold text-critical">{criticalCount}</div>
          </div>
          <div className="panel p-4 flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-textSecondary mb-2 flex items-center gap-1">
              <Activity className="size-3 text-medium" /> Pending Verification
            </span>
            <div className="text-2xl font-bold text-medium">{pendingVerificationCount}</div>
          </div>
          <div className="panel p-4 flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-textSecondary mb-2 flex items-center gap-1">
              <CheckCircle2 className="size-3 text-resolved" /> Resolved Count
            </span>
            <div className="text-2xl font-bold text-resolved">{resolvedCount}</div>
          </div>
        </section>

        {/* FEATURE 5: Latest Incident Banner */}
        {latestIncident && (
          <section className="bg-panel border border-info/30 p-3.5 flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-bold uppercase tracking-widest text-info bg-info/10 px-2 py-1 border border-info/30 shrink-0">Latest Incident</span>
              <div>
                <span className="text-xs font-bold text-textPrimary block">{latestIncident.title}</span>
                <span className="text-[10px] text-textSecondary font-mono">{latestIncident.category} · {latestIncident.severity} Severity · Status: {latestIncident.status}</span>
              </div>
            </div>
            <span className="text-[10px] text-textSecondary font-mono">{relativeTime(latestIncident.created_at)}</span>
          </section>
        )}

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

        {/* Live Incident Map */}
        <section className="panel p-4 flex flex-col h-[400px]">
          <h3 className="text-xs font-bold uppercase text-textSecondary flex items-center gap-2 mb-4 shrink-0">
            <MapIcon className="size-4 text-info" /> Spatial Map Overview
          </h3>
          <div className="flex-1 rounded overflow-hidden relative z-0">
            <IncidentMap incidents={incidents} />
          </div>
        </section>

        <div className="grid lg:grid-cols-12 gap-6">
          
          {/* Left Col: Dispatch Queue */}
          <section className="lg:col-span-5 flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase text-textSecondary flex items-center gap-2">
              <Crosshair className="size-4 text-high" /> Live Dispatch Queue
            </h3>
            <div className="space-y-3">
              {dispatchQueue.length === 0 ? (
                <div className="panel p-4 text-xs text-textSecondary font-mono text-center">No active dispatches</div>
              ) : (
                dispatchQueue.map((q, i) => (
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
                ))
              )}
            </div>
          </section>

          {/* Center Col: AI Decisions & Progress */}
          <section className="lg:col-span-4 flex flex-col gap-6">
            <div>
              <h3 className="text-xs font-bold uppercase text-textSecondary flex items-center gap-2 mb-4">
                <Activity className="size-4 text-info" /> AI Routing Decisions
              </h3>
              <div className="space-y-4">
                {aiDecisions.length === 0 ? (
                  <p className="text-xs text-textSecondary font-mono">No AI decisions available yet.</p>
                ) : (
                  aiDecisions.map((dec, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="text-[10px] font-bold text-textSecondary shrink-0 w-14 font-mono">{dec.time}</span>
                      <p className="text-xs text-textPrimary border-l-2 border-border pl-3 py-0.5 leading-relaxed">{dec.action}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="panel p-4">
              <h3 className="text-xs font-bold uppercase text-textSecondary flex items-center gap-2 mb-4">
                <CheckCircle2 className="size-4 text-resolved" /> Response Progress
              </h3>
              <div className="space-y-4 text-xs font-mono uppercase tracking-wide">
                <div>
                  {(() => {
                    const total    = stats?.total ?? 0
                    const resolved = stats?.resolved ?? 0
                    const pct      = total > 0 ? Math.round((resolved / total) * 100) : 0
                    return (
                      <>
                        <div className="flex justify-between mb-1">
                          <span className="text-textSecondary">Active Incidents ({total})</span>
                          <span className="font-bold text-textPrimary">{pct}% Resolved</span>
                        </div>
                        <div className="w-full bg-border h-1">
                          <div className="bg-resolved h-1" style={{ width: `${pct}%` }} />
                        </div>
                      </>
                    )
                  })()}
                </div>
                <div>
                  {(() => {
                    const total    = stats?.total ?? 0
                    const critical = stats?.critical ?? 0
                    const sla      = total > 0 ? Math.max(0, Math.round(((total - critical) / total) * 100)) : 100
                    return (
                      <>
                        <div className="flex justify-between mb-1">
                          <span className="text-textSecondary">SLA Compliance</span>
                          <span className="font-bold text-textPrimary">{sla}%</span>
                        </div>
                        <div className="w-full bg-border h-1">
                          <div className="bg-info h-1" style={{ width: `${sla}%` }} />
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-2 gap-4">
              <div className="panel p-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-textSecondary mb-4">Severity Breakdown</h3>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stats?.severity_distribution || []} dataKey="count" nameKey="severity" cx="50%" cy="50%" innerRadius={30} outerRadius={45} stroke="none">
                        {(stats?.severity_distribution || []).map((entry, index) => {
                          const sev = (entry as {severity: string}).severity;
                          const color = sev === 'Critical' ? '#ef4444' : sev === 'High' ? '#f97316' : sev === 'Medium' ? '#eab308' : '#22c55e';
                          return <Cell key={`cell-${index}`} fill={color} />
                        })}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #30363D', fontSize: '10px' }} itemStyle={{ color: '#E2E8F0' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="panel p-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-textSecondary mb-4">Category Distribution</h3>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.category_distribution || []}>
                      <XAxis dataKey="category" hide />
                      <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #30363D', fontSize: '10px' }} itemStyle={{ color: '#E2E8F0' }} cursor={{ fill: '#30363D' }} />
                      <Bar dataKey="count" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
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
                {officerAssignments.length === 0 ? (
                  <div className="p-3 text-[10px] text-textSecondary font-mono text-center">No assignments</div>
                ) : (
                  officerAssignments.map((off, i) => (
                    <div key={i} className="grid grid-cols-4 items-center p-3 text-xs bg-primary hover:bg-[#1A202C] transition-colors cursor-pointer">
                      <div className="col-span-2">
                        <span className="block font-bold text-textPrimary">{off.officer}</span>
                        <span className="text-[10px] text-textSecondary font-mono">{off.badge}</span>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${off.status === 'On Scene' ? 'text-resolved' : off.status === 'En Route' ? 'text-info' : 'text-textSecondary'}`}>{off.status}</span>
                      <span className="text-right font-mono text-textSecondary text-[10px]">{off.incident}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

        </div>
      </div>
    </RootLayout>
  )
}
