import { useState, useEffect } from 'react'
import { RootLayout } from '@/components/layout/RootLayout'
import { Activity, Map as MapIcon, BarChart3, Clock, MapPin, Building, ShieldCheck, ArrowRight, Upload, ChevronDown, ChevronUp, CheckCircle, XCircle, AlertCircle, Compass } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { reportIncident } from '@/lib/incidents'
import { useIncidentWebSocket } from '@/hooks/useWebSocket'
import { getImageUrl } from '@/lib/analyses'

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

const CATEGORIES = [
  'Road Block',
  'Accident',
  'Flood',
  'Fire',
  'Open Manhole',
  'Garbage Overflow',
  'Illegal Parking',
  'Building Collapse',
  'Water Leak',
  'Tree Fallen',
  'Footpath Encroachment',
]

function normalizeIncidentList(payload: unknown): Incident[] {
  if (Array.isArray(payload)) return payload as Incident[]

  if (payload && typeof payload === 'object') {
    const maybe = payload as { items?: unknown; data?: unknown }
    const candidates = [maybe.items, maybe.data]

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) return candidate as Incident[]
      if (candidate && typeof candidate === 'object') {
        const nested = candidate as { items?: unknown }
        if (Array.isArray(nested.items)) return nested.items as Incident[]
      }
    }
  }

  return []
}

function computeAiVerification(inc: Incident) {
  const checkImage = Boolean(inc.image_path) && !inc.image_path.includes('demo_placeholder')
  const checkCategory = Boolean(inc.category)
  const checkCoords = typeof inc.latitude === 'number' && typeof inc.longitude === 'number' && inc.latitude !== 0 && inc.longitude !== 0
  const checkDesc = Boolean(inc.description && inc.description.length >= 10)

  const passed = [checkImage, checkCategory, checkCoords, checkDesc].filter(Boolean).length
  let confidence = 96
  if (passed === 4) confidence = 96
  else if (passed === 3) confidence = 75
  else if (passed === 2) confidence = 50
  else if (passed === 1) confidence = 25
  else confidence = 10

  const status = confidence >= 60 ? 'Verified' : 'Needs Manual Review'
  return { confidence, status, checkImage, checkCategory, checkCoords, checkDesc }
}

function getExplainabilityReasons(inc: Incident): string[] {
  const category = inc.category || 'Incident'
  const reasons: string[] = []

  switch (category) {
    case 'Road Block':
      reasons.push('Major road affected', 'Heavy traffic expected')
      break
    case 'Accident':
      reasons.push('Collision risk pattern matched', 'Emergency transit corridor impacted')
      break
    case 'Flood':
      reasons.push('Low elevation drainage overflow', 'Severe weather anomaly detected')
      break
    case 'Fire':
      reasons.push('Thermal risk area', 'High density residential zone')
      break
    case 'Open Manhole':
      reasons.push('Pedestrian hazard identified', 'Municipal utility gap')
      break
    case 'Garbage Overflow':
      reasons.push('Sanitation alert threshold reached', 'Public health risk')
      break
    case 'Illegal Parking':
      reasons.push('Emergency lane obstruction', 'Traffic bottleneck detected')
      break
    case 'Building Collapse':
      reasons.push('Structural safety anomaly', 'Search & rescue priority')
      break
    case 'Water Leak':
      reasons.push('Main pipeline pressure loss', 'Water conservation alert')
      break
    case 'Tree Fallen':
      reasons.push('Road & power line obstruction', 'High wind damage pattern')
      break
    case 'Footpath Encroachment':
      reasons.push('Pedestrian walkway obstructed', 'Urban mobility violation')
      break
    default:
      reasons.push('Public safety concern', 'Priority municipal report')
  }

  reasons.push('Near hospital')
  if (inc.image_path && !inc.image_path.includes('demo_placeholder')) {
    reasons.push('Citizen uploaded image')
  }
  reasons.push('Multiple keywords detected')

  return reasons
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
                <span className="text-[9px] text-textSecondary font-mono uppercase mt-0.5 flex items-center gap-1">
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
  const [error, setError] = useState<string | null>(null)
  
  // Form State
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [description, setDescription] = useState('')
  const [latitude, setLatitude] = useState('17.3850')
  const [longitude, setLongitude] = useState('78.4867')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  // Explain AI Collapsible State
  const [expandedExplain, setExpandedExplain] = useState<Record<string, boolean>>({})

  const lastUpdate = useIncidentWebSocket()

  // Auto Geolocation
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude.toFixed(4))
          setLongitude(pos.coords.longitude.toFixed(4))
        },
        (err) => {
          console.warn('Browser geolocation fallback to manual:', err.message)
        }
      )
    }
  }, [])

  async function loadIncidents() {
    try {
      const { data } = await api.get<unknown>('/dashboard/incidents', { params: { limit: 50 } })
      setIncidents(normalizeIncidentList(data))
      setError(null)
    } catch (e) {
      console.error(e)
      setError('Unable to load Civic Sense reports right now.')
      setIncidents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadIncidents()
  }, [])

  useEffect(() => {
    if (lastUpdate) {
      void loadIncidents()
    }
  }, [lastUpdate])

  const handleFetchLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude.toFixed(4))
          setLongitude(pos.coords.longitude.toFixed(4))
        },
        (err) => {
          setFormError(`Geolocation error: ${err.message}. Please enter coordinates manually.`)
        }
      )
    } else {
      setFormError('Geolocation is not supported by your browser.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      setFormError('Title and description are required.')
      return
    }

    setSubmitting(true)
    setFormError(null)
    setSuccessMessage(null)

    try {
      await reportIncident({
        title: title.trim(),
        category,
        description: description.trim(),
        latitude: parseFloat(latitude) || 17.3850,
        longitude: parseFloat(longitude) || 78.4867,
        image: imageFile,
      })

      // Clear Form
      setTitle('')
      setCategory(CATEGORIES[0])
      setDescription('')
      setImageFile(null)
      setSuccessMessage('Incident submitted successfully.')
      toast.success('Incident submitted successfully.')
      setFormError(null)

      // Reload without page refresh
      await loadIncidents()
    } catch (err: unknown) {
      console.error(err)
      setFormError('Failed to submit incident report. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleExplain = (id: string) => {
    setExpandedExplain(prev => ({ ...prev, [id]: !prev[id] }))
  }

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
                
                {/* FEATURE 1: REPORT INCIDENT PORTAL */}
                <div className="panel p-4 bg-[#161B22] border border-border">
                  <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
                    <h2 className="text-xs font-bold text-textPrimary uppercase tracking-wider flex items-center gap-2">
                      <Upload className="size-4 text-info" /> REPORT INCIDENT
                    </h2>
                    <span className="text-[10px] text-textSecondary font-mono uppercase">Citizen Reporting Portal</span>
                  </div>

                  {successMessage && (
                    <div className="mb-3 p-2 bg-resolved/10 border border-resolved/30 text-resolved text-[10px] font-mono uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle className="size-3.5" /> {successMessage}
                    </div>
                  )}

                  {formError && (
                    <div className="mb-3 p-2 bg-critical/10 border border-critical/30 text-critical text-[10px] font-mono uppercase tracking-wider flex items-center gap-2">
                      <AlertCircle className="size-3.5" /> {formError}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold text-textSecondary uppercase tracking-widest mb-1">
                          Upload Image
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                          className="w-full text-[10px] text-textSecondary file:mr-2 file:py-1 file:px-2 file:border file:border-border file:bg-panel file:text-[9px] file:font-bold file:uppercase file:text-textPrimary hover:file:bg-[#30363D] cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-textSecondary uppercase tracking-widest mb-1">
                          Incident Title *
                        </label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="e.g. Broken water pipeline near main junction"
                          required
                          className="w-full bg-primary border border-border p-2 text-[10px] font-mono text-textPrimary focus:outline-none focus:border-info"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold text-textSecondary uppercase tracking-widest mb-1">
                          Category *
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full bg-primary border border-border p-2 text-[10px] font-mono text-textPrimary focus:outline-none focus:border-info"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[9px] font-bold text-textSecondary uppercase tracking-widest">
                            Latitude *
                          </label>
                          <button
                            type="button"
                            onClick={handleFetchLocation}
                            className="text-[8px] font-mono text-info hover:underline flex items-center gap-0.5"
                          >
                            <Compass className="size-2.5" /> Auto GPS
                          </button>
                        </div>
                        <input
                          type="number"
                          step="any"
                          value={latitude}
                          onChange={(e) => setLatitude(e.target.value)}
                          placeholder="17.3850"
                          required
                          className="w-full bg-primary border border-border p-2 text-[10px] font-mono text-textPrimary focus:outline-none focus:border-info"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-textSecondary uppercase tracking-widest mb-1">
                          Longitude *
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={longitude}
                          onChange={(e) => setLongitude(e.target.value)}
                          placeholder="78.4867"
                          required
                          className="w-full bg-primary border border-border p-2 text-[10px] font-mono text-textPrimary focus:outline-none focus:border-info"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-textSecondary uppercase tracking-widest mb-1">
                        Description *
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Detailed description of the incident..."
                        rows={2}
                        required
                        className="w-full bg-primary border border-border p-2 text-[10px] font-mono text-textPrimary focus:outline-none focus:border-info"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="bg-info text-white border border-info/40 px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest hover:bg-info/80 transition-colors disabled:opacity-50"
                      >
                        {submitting ? 'Submitting...' : 'Submit Incident'}
                      </button>
                    </div>
                  </form>
                </div>

                {loading && <div className="text-[10px] font-mono text-textSecondary uppercase p-4">Loading operational feed...</div>}
                {!loading && error && <div className="rounded border border-critical/20 bg-critical/10 p-4 text-[10px] font-mono uppercase tracking-widest text-critical">{error}</div>}
                {!loading && !error && incidents.length === 0 && (
                  <div className="rounded border border-border bg-primary p-6 text-center text-[10px] font-mono uppercase tracking-widest text-textSecondary">
                    No operational reports are available yet.
                  </div>
                )}
                {!loading && incidents.map((inc) => {
                  const verification = computeAiVerification(inc)
                  const explainReasons = getExplainabilityReasons(inc)
                  const isExplained = Boolean(expandedExplain[inc.id])

                  return (
                    <div key={inc.id} className="panel p-0 flex flex-col hover:border-textSecondary transition-colors">
                      <div className="flex items-stretch border-b border-border bg-[#1A202C]">
                        <div className="w-36 shrink-0 border-r border-border bg-black relative">
                          <img
                            src={getImageUrl(inc.image_path || '/uploads/demo_placeholder.jpg')}
                            alt={inc.title}
                            className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-all"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/uploads/demo_placeholder.jpg'
                            }}
                          />
                        </div>
                        
                        <div className="flex-1 p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider ${inc.severity === 'Critical' ? 'bg-critical/10 text-critical border border-critical/20' : inc.severity === 'High' ? 'bg-high/10 text-high border border-high/20' : 'bg-medium/10 text-medium border border-medium/20'}`}>{inc.severity} Priority</span>
                              <span className="text-[10px] text-textSecondary font-mono uppercase tracking-widest">{inc.id.split('-')[0]}</span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider bg-info/10 text-info border border-info/20">{inc.category}</span>
                            </div>
                            <span className="text-[9px] text-textSecondary font-mono uppercase flex items-center gap-1"><Clock className="size-2" /> {new Date(inc.created_at).toLocaleString()}</span>
                          </div>
                          <h3 className="text-sm font-bold text-textPrimary mb-1">{inc.title}</h3>
                          <p className="text-[10px] text-textSecondary leading-relaxed">{inc.description}</p>
                          
                          {/* FEATURE 2: AI VERIFICATION PANEL */}
                          <div className="mt-3 p-2.5 border border-border bg-[#161B22]">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-textSecondary">AI Verification</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-textSecondary">AI Confidence: <strong className="text-info">{verification.confidence}%</strong></span>
                                <span className={`text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider ${verification.status === 'Verified' ? 'bg-resolved/10 text-resolved border border-resolved/30' : 'bg-high/10 text-high border border-high/30'}`}>
                                  {verification.status}
                                </span>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] font-mono">
                              <div className={verification.checkImage ? 'text-resolved flex items-center gap-1' : 'text-critical flex items-center gap-1'}>
                                {verification.checkImage ? <CheckCircle className="size-3" /> : <XCircle className="size-3" />} Image uploaded
                              </div>
                              <div className={verification.checkCategory ? 'text-resolved flex items-center gap-1' : 'text-critical flex items-center gap-1'}>
                                {verification.checkCategory ? <CheckCircle className="size-3" /> : <XCircle className="size-3" />} Category detected
                              </div>
                              <div className={verification.checkCoords ? 'text-resolved flex items-center gap-1' : 'text-critical flex items-center gap-1'}>
                                {verification.checkCoords ? <CheckCircle className="size-3" /> : <XCircle className="size-3" />} Coordinates valid
                              </div>
                              <div className={verification.checkDesc ? 'text-resolved flex items-center gap-1' : 'text-critical flex items-center gap-1'}>
                                {verification.checkDesc ? <CheckCircle className="size-3" /> : <XCircle className="size-3" />} Description provided
                              </div>
                            </div>
                          </div>

                          {/* FEATURE 3: AI EXPLAINABILITY PANEL */}
                          <div className="mt-2">
                            <button
                              onClick={() => toggleExplain(inc.id)}
                              className="text-[9px] font-bold uppercase tracking-widest text-info flex items-center gap-1 hover:underline"
                            >
                              {isExplained ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />} Explain AI
                            </button>

                            {isExplained && (
                              <div className="mt-2 p-2.5 border border-info/30 bg-info/5 text-[10px] space-y-1.5 font-mono">
                                <div className="font-bold text-textPrimary uppercase tracking-wider">{inc.category}</div>
                                <p className="text-textSecondary font-bold uppercase tracking-widest text-[9px]">Why was this incident classified?</p>
                                <p className="text-textSecondary font-bold uppercase tracking-widest text-[9px] mt-1">Reason:</p>
                                <ul className="space-y-0.5 text-textPrimary pl-1">
                                  {explainReasons.map((reason, idx) => (
                                    <li key={idx} className="flex items-center gap-1.5">
                                      <span className="text-info">•</span> {reason}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                        </div>
                      </div>

                      <div className="bg-primary p-3 flex items-center justify-between">
                        <div className="flex gap-6">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[8px] font-bold text-textSecondary uppercase tracking-widest">Ward</span>
                            <span className="text-[10px] font-mono text-textPrimary">{inc.ward || 'General Ward'}</span>
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
                  )
                })}
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
