import { Activity, BrainCircuit, MapPinned, Radio, ShieldCheck, Workflow } from 'lucide-react'
import { API_BASE_URL, WS_BASE_URL } from '@/lib/api'

export const siteConfig = { name: 'CityPulse AI', description: 'AI-Powered Smart City Command Center', navigation: [{ label: 'Dashboard', href: 'dashboard' }, { label: 'Emergency Map', href: 'map' }, { label: 'Capabilities', href: '#capabilities' }, { label: 'Technology', href: '#technology' }] }

export const features = [
  { icon: BrainCircuit, title: 'Detection intelligence', description: 'A future-ready foundation for computer vision and multimodal signals to surface emerging threats.' },
  { icon: MapPinned, title: 'Geospatial awareness', description: 'Designed to bring incident context, affected areas, and response resources into one shared view.' },
  { icon: Radio, title: 'Coordinated response', description: 'A deliberate workflow for agencies to assess, prioritize, and communicate with confidence.' },
]

export const workflow = [
  { icon: Activity, step: '01', title: 'Receive signals', description: 'Ingest validated sources through future provider adapters.' },
  { icon: ShieldCheck, step: '02', title: 'Assess impact', description: 'Apply intelligence and human review before action.' },
  { icon: Workflow, step: '03', title: 'Coordinate action', description: 'Turn shared context into a clear response plan.' },
]

export const technologies = ['React', 'FastAPI', 'PostgreSQL', 'Tailwind CSS', 'TypeScript', 'SQLAlchemy']

export { API_BASE_URL, WS_BASE_URL }

