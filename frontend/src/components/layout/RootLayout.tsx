import { ReactNode } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Home, LayoutDashboard, Activity, Map, History, Truck, Shield } from 'lucide-react'
import { NotificationCenter } from './NotificationCenter'

const navLinks = [
  { name: 'Mission Control', to: '/', icon: Home },
  { name: 'Command Center', to: '/dashboard', icon: LayoutDashboard },
  { name: 'Emergency Map', to: '/map', icon: Map },
  { name: 'Civic Sense', to: '/civic-sense', icon: Activity },
  { name: 'Operations History', to: '/history', icon: History },
  { name: 'Resource Management', to: '/resources', icon: Truck },
]

type RootLayoutProps = {
  children: ReactNode
  rightPanel?: ReactNode
}

export function RootLayout({ children, rightPanel }: RootLayoutProps) {
  const location = useLocation()

  return (
    <div className="flex h-screen w-full bg-primary overflow-hidden text-textPrimary">
      
      {/* LEFT COLUMN: Permanent Navigation (Linear/Azure style) */}
      <aside className="w-64 shrink-0 flex flex-col border-r border-border bg-panel">
        <div className="h-16 flex items-center px-6 border-b border-border shrink-0">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="rounded bg-blue-500/10 p-1.5 border border-blue-500/20">
              <Shield className="size-4 text-info" />
            </div>
            <span className="text-sm font-bold tracking-wide text-textPrimary">GHMC <span className="text-info font-normal">Command</span></span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-textSecondary">Operations</div>
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to
            return (
              <Link
                key={link.name}
                to={link.to}
                className={`flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-[#30363D] text-textPrimary' 
                    : 'text-textSecondary hover:bg-[#30363D]/50 hover:text-textPrimary'
                }`}
              >
                <link.icon className={`size-4 ${isActive ? 'text-info' : ''}`} />
                {link.name}
              </Link>
            )
          })}
        </div>

        <div className="p-4 border-t border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded overflow-hidden border border-border">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin&backgroundColor=0B0F17" alt="Avatar" className="size-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-textPrimary truncate">Admin Officer</p>
              <p className="text-[10px] text-textSecondary uppercase tracking-wider">ID: GHMC-001</p>
            </div>
            <NotificationCenter />
          </div>
        </div>
      </aside>

      {/* CENTER COLUMN: Main Content */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>

      {/* RIGHT COLUMN: Contextual Panel */}
      {rightPanel && (
        <aside className="w-80 shrink-0 border-l border-border bg-panel flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            {rightPanel}
          </div>
        </aside>
      )}

    </div>
  )
}
