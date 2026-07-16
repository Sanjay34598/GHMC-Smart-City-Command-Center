import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  Building2,
  Filter,
  Flame,
  MapPin,
  RefreshCw,
  RotateCcw,
  Search,
  Shield,
  ShieldAlert,
  X,
  Truck,
  Navigation
} from 'lucide-react'
import { RootLayout } from '@/components/layout/RootLayout'
import { getMapIncidents, getEmergencyServices, type MapIncident, type EmergencyService, type MapFilters } from '@/lib/map'
import { useWebSocket } from '@/hooks/useWebSocket'
import { WS_BASE_URL } from '@/constants/site'

const EmergencyMapView = lazy(() =>
  import('@/components/map/EmergencyMapView').then((m) => ({ default: m.EmergencyMapView })),
)

const SEVERITIES = ['Critical', 'High', 'Medium', 'Low']
const CATEGORIES = ['Fire', 'Flood', 'Earthquake', 'Road Accident', 'Building Collapse', 'Landslide', 'Other']
const STATUSES = ['reported', 'under_review', 'responding', 'resolved']
const DATE_RANGES = [
  { label: 'Last 24 h', days: 1 },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'All time', days: undefined },
]
const SERVICE_CATEGORIES = [
  { value: 'hospital', label: 'Hospitals', icon: Building2, color: '#06b6d4' },
  { value: 'fire_station', label: 'Fire Stations', icon: Flame, color: '#f97316' },
  { value: 'police', label: 'Police', icon: Shield, color: '#3b82f6' },
  { value: 'shelter', label: 'Shelters', icon: ShieldAlert, color: '#a855f7' },
]

const SEVERITY_DOT: Record<string, string> = {
  Critical: 'bg-critical',
  High:     'bg-high',
  Medium:   'bg-medium',
  Low:      'bg-resolved',
}

const REFRESH_INTERVAL_MS = 30_000

function MapSkeleton() {
  return (
    <div className="flex h-full w-full animate-pulse items-center justify-center bg-primary">
      <div className="text-center">
        <MapPin className="mx-auto mb-3 size-10 text-textSecondary" />
        <p className="text-[10px] font-mono uppercase tracking-widest text-textSecondary">Initializing GIS Engine…</p>
      </div>
    </div>
  )
}

function Legend() {
  return (
    <div className="absolute bottom-5 left-5 z-[500] border border-border bg-panel p-3 text-[10px] uppercase font-bold tracking-widest shadow-xl">
      <p className="text-textPrimary mb-2">Severity Level</p>
      {[
        { label: 'Critical', color: '#FF4D4F' },
        { label: 'High',     color: '#FF7A00' },
        { label: 'Medium',   color: '#FACC15' },
        { label: 'Low',      color: '#22C55E' },
      ].map(({ label, color }) => (
        <div key={label} className="flex items-center gap-2 mb-1.5 last:mb-0">
          <span className="size-2" style={{ background: color }} />
          <span className="text-textSecondary">{label}</span>
        </div>
      ))}
      <p className="text-textPrimary mt-4 mb-2">Service Units</p>
      {SERVICE_CATEGORIES.map(({ label, color }) => (
        <div key={label} className="flex items-center gap-2 mb-1.5 last:mb-0">
          <span className="size-2 rounded-full" style={{ background: color }} />
          <span className="text-textSecondary">{label}</span>
        </div>
      ))}
    </div>
  )
}

export function EmergencyMapPage() {
  const [incidents, setIncidents]       = useState<MapIncident[]>([])
  const [services, setServices]         = useState<EmergencyService[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)
  const [filters, setFilters]           = useState<MapFilters>({})
  const [search, setSearch]             = useState('')
  const [showFilters, setShowFilters]   = useState(false)
  const [showServices, setShowServices] = useState(false)
  const [selectedId, setSelectedId]     = useState<string | null>(null)
  const [lastRefresh, setLastRefresh]   = useState<Date>(new Date())
  const [refreshing, setRefreshing]     = useState(false)

  const centreRef = useRef<{ lat: number; lon: number } | null>({ lat: 17.3850, lon: 78.4867 })

  const fetchIncidents = useCallback(
    (currentFilters: MapFilters, silent = false) => {
      return Promise.resolve()
        .then(() => {
          if (!silent) setLoading(true);
          else setRefreshing(true);
          return getMapIncidents(currentFilters);
        })
        .then((result) => {
          setIncidents(result.items);
          setError(null);
          setLastRefresh(new Date());
          if (result.items.length > 0) {
            const lat = result.items.reduce((s, i) => s + i.latitude, 0) / result.items.length;
            const lon = result.items.reduce((s, i) => s + i.longitude, 0) / result.items.length;
            centreRef.current = { lat, lon };
          }
        })
        .catch(() => setError('Failed to load incidents.'))
        .finally(() => {
          setLoading(false);
          setRefreshing(false);
        });
    },
    []
  );

  useEffect(() => {
    fetchIncidents(filters);
  }, [filters, fetchIncidents]);

  useEffect(() => {
    const timer = setInterval(() => fetchIncidents(filters, true), REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [filters, fetchIncidents]);

  useWebSocket(`${WS_BASE_URL}/incidents`, {
    onMessage: () => fetchIncidents(filters, true)
  });

  useEffect(() => {
    if (!showServices || !centreRef.current) return
    const { lat, lon } = centreRef.current
    getEmergencyServices(lat, lon, 10000)
      .then((result) => setServices(result.items))
      .catch(() => setServices([]))
  }, [showServices])

  const displayed = search.trim()
    ? incidents.filter(
        (inc) =>
          inc.title.toLowerCase().includes(search.toLowerCase()) ||
          inc.description.toLowerCase().includes(search.toLowerCase()),
      )
    : incidents

  const resetFilters = () => { setFilters({}); setSearch('') }
  const activeCount = [filters.severity, filters.category, filters.status, filters.days, search.trim()].filter(Boolean).length

  const inputCls = 'w-full border border-border bg-primary px-3 py-2 text-[10px] font-mono text-textPrimary uppercase tracking-widest placeholder:text-textSecondary focus:outline-none focus:border-info transition-colors'

  const RightContextPanel = (
    <div className="flex flex-col h-full bg-panel">
      <div className="p-4 border-b border-border bg-[#1A202C]">
        <h3 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest flex items-center gap-2">
          <Navigation className="size-3" /> GIS Context & Filters
        </h3>
      </div>
      
      <div className="p-4 border-b border-border space-y-3 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 size-3 text-textSecondary" />
          <input
            id="map-search"
            type="text"
            placeholder="Search clusters…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputCls} pl-8`}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-2.5">
              <X className="size-3 text-textSecondary hover:text-textPrimary" />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters((p) => !p)}
            className="flex-1 border border-border bg-primary py-2 text-[9px] font-bold uppercase tracking-widest hover:bg-[#30363D] transition-colors relative"
          >
            Filters
            {activeCount > 0 && <span className="absolute -top-1 -right-1 size-2 bg-info rounded-full"></span>}
          </button>
          <button
            onClick={() => fetchIncidents(filters, true)}
            className="border border-border bg-primary px-3 py-2 text-[9px] font-bold uppercase tracking-widest hover:bg-[#30363D] transition-colors"
          >
            <RefreshCw className={`size-3 ${refreshing ? 'animate-spin text-info' : 'text-textSecondary'}`} />
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2 overflow-hidden">
              <select value={filters.severity ?? ''} onChange={(e) => setFilters((f) => ({ ...f, severity: e.target.value || undefined }))} className={inputCls}>
                <option value="">All severities</option>
                {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filters.category ?? ''} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value || undefined }))} className={inputCls}>
                <option value="">All categories</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={filters.status ?? ''} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))} className={inputCls}>
                <option value="">All statuses</option>
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {selectedId && (
        <div className="p-4 border-b border-border shrink-0 bg-info/5 border-l-2 border-l-info">
          <h4 className="text-[10px] font-bold text-info uppercase tracking-widest mb-3 flex items-center gap-2">
            <Truck className="size-3" /> Nearest Resources
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-textSecondary font-bold">Kukatpally Depot</span>
              <span className="text-info font-mono">2.4 km</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-textSecondary font-bold">TFS Unit 89</span>
              <span className="text-info font-mono">4.1 km</span>
            </div>
            <button className="w-full bg-info/10 border border-info/30 text-info py-2 text-[9px] font-bold uppercase tracking-widest hover:bg-info hover:text-white transition-colors mt-2">
              Dispatch Nearest Unit
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <h4 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest mb-2">Visible Clusters ({displayed.length})</h4>
        {displayed.map((inc) => (
          <button
            key={inc.id}
            onClick={() => setSelectedId(inc.id === selectedId ? null : inc.id)}
            className={`w-full text-left p-3 border transition-colors ${
              selectedId === inc.id ? 'bg-[#30363D] border-textSecondary' : 'bg-primary border-border hover:border-textSecondary'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-1.5">
                <span className={`size-1.5 ${SEVERITY_DOT[inc.severity] ?? 'bg-border'}`} />
                <span className="text-[9px] font-bold text-textSecondary uppercase tracking-widest">{inc.severity}</span>
              </div>
              <span className="text-[9px] font-mono text-textSecondary">{inc.id.split('-')[0]}</span>
            </div>
            <p className="text-xs font-bold text-textPrimary mb-1">{inc.title}</p>
            <p className="text-[10px] text-textSecondary font-mono">{inc.category}</p>
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <RootLayout rightPanel={RightContextPanel}>
      <div className="relative w-full h-full bg-primary flex flex-col">
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[600] bg-critical/10 border border-critical text-critical px-4 py-2 text-[10px] font-bold uppercase tracking-widest shadow-xl">
            {error}
          </div>
        )}

        {/* Action bar floating over map */}
        <div className="absolute top-4 right-4 z-[500] flex gap-2">
          <button
            onClick={() => setShowServices((p) => !p)}
            className={`px-4 py-2 text-[9px] font-bold uppercase tracking-widest transition-colors border ${
              showServices ? 'bg-info/20 text-info border-info/40' : 'bg-panel border-border text-textSecondary hover:bg-[#30363D]'
            }`}
          >
            {showServices ? 'Hide Infrastructure' : 'Show Infrastructure'}
          </button>
        </div>

        <div className="flex-1 w-full relative z-[100]">
          <Suspense fallback={<MapSkeleton />}>
            <EmergencyMapView incidents={displayed} services={services} showServices={showServices} />
          </Suspense>
        </div>

        <Legend />
      </div>
    </RootLayout>
  )
}
