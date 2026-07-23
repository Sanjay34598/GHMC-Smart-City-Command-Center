import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Check, CheckCircle2, ShieldAlert } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  type Notification, 
  getNotifications, 
  markNotificationRead, 
  markAllNotificationsRead 
} from '@/lib/notifications'
import { useWebSocket } from '@/hooks/useWebSocket'
import { WS_BASE_URL } from '@/constants/site'

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const unreadCount = notifications.filter(n => !n.is_read).length

  useEffect(() => {
    getNotifications()
      .then(items => setNotifications(items.slice(0, 20)))
      .catch(console.error)
  }, [])

  useWebSocket(`${WS_BASE_URL}/incidents`, {
    onMessage: (event) => {
      const notification = event as Notification
      
      let icon = '🚨'
      if (notification.type === 'INCIDENT_RESOLVED' || notification.message?.includes('Resolved')) {
        icon = '✅'
      } else if (notification.message?.includes('Police')) {
        icon = '🚓'
      } else if (notification.message?.includes('Ambulance') || notification.message?.includes('Medical')) {
        icon = '🚑'
      } else if (notification.severity === 'Critical' || notification.title?.includes('Fire')) {
        icon = '🔥'
      }

      toast(`${notification.title}\n${notification.message}`, {
        icon,
        style: {
          borderRadius: '0px',
          background: '#181818',
          color: '#FFFFFF',
          border: '1px solid #2A2A2A',
          fontSize: '11px',
          fontFamily: 'monospace'
        }
      })
      
      setNotifications(prev => [notification, ...prev].slice(0, 20))
    }
  })

  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await markNotificationRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch (error) {
      console.error(error)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch (error) {
      console.error(error)
    }
  }

  const getStatusIcon = (n: Notification) => {
    if (n.type === 'INCIDENT_RESOLVED' || n.message?.includes('Resolved')) return '✅'
    if (n.message?.includes('Police')) return '🚓'
    if (n.message?.includes('Ambulance') || n.message?.includes('Medical')) return '🚑'
    if (n.title?.includes('Fire') || n.severity === 'Critical') return '🔥'
    return '🚨'
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center rounded p-2 text-textSecondary hover:bg-[#30363D] hover:text-textPrimary transition-colors"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full bg-critical text-[8px] font-bold text-white animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              className="absolute right-0 mt-2 w-80 sm:w-96 overflow-hidden border border-border bg-[#161B22] shadow-2xl z-50 rounded-none"
            >
              <div className="flex items-center justify-between border-b border-border bg-[#1A202C] px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-textPrimary">Live Command Feed</span>
                  <span className="text-[9px] font-mono text-textSecondary">({notifications.length}/20)</span>
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-[9px] font-bold text-info hover:underline uppercase tracking-wider"
                  >
                    <CheckCircle2 className="size-3" />
                    Mark all read
                  </button>
                )}
              </div>
              
              <div className="max-h-[380px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-xs font-mono uppercase text-textSecondary">
                    No active notifications.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {notifications.map((n) => (
                      <Link 
                        key={n.id}
                        to={`/incidents/${n.incident_id}`}
                        onClick={() => setIsOpen(false)}
                        className={`block p-3 transition hover:bg-[#1A202C] ${!n.is_read ? 'bg-info/5' : ''}`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="text-base shrink-0 select-none mt-0.5">{getStatusIcon(n)}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-xs font-bold ${!n.is_read ? 'text-textPrimary' : 'text-textSecondary'}`}>
                                {n.title}
                              </p>
                              {!n.is_read && (
                                <button 
                                  onClick={(e) => handleMarkRead(n.id, e)}
                                  className="text-textSecondary hover:text-textPrimary shrink-0"
                                  title="Mark as read"
                                >
                                  <Check className="size-3" />
                                </button>
                              )}
                            </div>
                            <p className="text-[10px] font-mono text-textSecondary leading-relaxed mt-0.5">
                              {n.message}
                            </p>
                            <p className="text-[9px] font-mono text-info uppercase mt-1">
                              {new Date(n.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
