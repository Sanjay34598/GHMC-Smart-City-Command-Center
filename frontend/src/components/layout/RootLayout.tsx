import { ReactNode } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Home, LayoutDashboard, Activity, Map, History, Truck, Shield, Sparkles, Settings as SettingsIcon } from 'lucide-react'
import { NotificationCenter } from './NotificationCenter'

const navLinks = [
  { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { name: 'Mission Control', to: '/', icon: Home },
  { name: 'Citizen Reports', to: '/civic-sense', icon: Activity },
  { name: 'Emergency Intelligence Map', to: '/map', icon: Map },
  { name: 'Operations History', to: '/history', icon: History },
  { name: 'Resource Command', to: '/resources', icon: Truck },
  { name: 'AI Insights', to: '/#insights', icon: Sparkles },
  { name: 'Settings', to: '/#settings', icon: SettingsIcon },
]

type RootLayoutProps = {
  children: ReactNode
  rightPanel?: ReactNode
}

export function RootLayout({ children, rightPanel }: RootLayoutProps) {
  const location = useLocation()

  return (
    <div className="flex h-screen w-full bg-[#000000] overflow-hidden text-white">
      
      {/* LEFT COLUMN: Black & White Permanent Navigation */}
      <aside className="w-64 shrink-0 flex flex-col border-r border-[#2A2A2A] bg-[#111111]">
        <div className="h-16 flex items-center px-6 border-b border-[#2A2A2A] shrink-0">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="rounded-none bg-white p-1.5 border border-white">
              <Shield className="size-4 text-black" />
            </div>
            <span className="text-sm font-black tracking-widest text-white uppercase">CityPulse <span className="font-light text-[#BDBDBD]">AI</span></span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
          <div className="px-3 pb-2 text-[9px] font-bold uppercase tracking-widest text-[#BDBDBD]">Smart City Operations</div>
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to
            return (
              <Link
                key={link.name}
                to={link.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-none text-xs font-bold uppercase tracking-wider transition-colors ${
                  isActive 
                    ? 'bg-white text-black' 
                    : 'text-[#BDBDBD] hover:bg-[#222222] hover:text-white'
                }`}
              >
                <link.icon className={`size-4 ${isActive ? 'text-black' : 'text-white'}`} />
                {link.name}
              </Link>
            )
          })}
        </div>

        <div className="p-4 border-t border-[#2A2A2A] shrink-0 bg-[#181818]">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-none overflow-hidden border border-[#2A2A2A] bg-black flex items-center justify-center font-bold text-xs text-white">
              CP
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">Command Officer</p>
              <p className="text-[9px] text-[#BDBDBD] uppercase tracking-wider font-mono">ID: CP-001</p>
            </div>
            <NotificationCenter />
          </div>
        </div>
      </aside>

      {/* CENTER COLUMN: Main Content */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden relative bg-[#000000]">
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>

      {/* RIGHT COLUMN: Contextual Panel */}
      {rightPanel && (
        <aside className="w-80 shrink-0 border-l border-[#2A2A2A] bg-[#111111] flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            {rightPanel}
          </div>
        </aside>
      )}

    </div>
  )
}
