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
    getNotifications().then(setNotifications).catch(console.error)
  }, [])

  useWebSocket(`${WS_BASE_URL}/incidents`, {
    onMessage: (event) => {
      const notification = event as Notification;
      // 1. Show Toast
      const icon = notification.severity === 'Critical' ? '🚨' : notification.severity === 'High' ? '🔥' : 'ℹ️'
      toast(`${notification.title}\n${notification.message}`, {
        icon,
        style: {
          borderRadius: '10px',
          background: '#1e293b',
          color: '#fff',
          border: '1px solid #334155'
        }
      })
      
      // 2. Add to list
      setNotifications(prev => [notification, ...prev])
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

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center rounded-full p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for click-outside */}
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 sm:w-96 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl z-50"
            >
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-800/50 px-4 py-3">
                <h3 className="font-semibold text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
                  >
                    <CheckCircle2 className="size-3" />
                    Mark all read
                  </button>
                )}
              </div>
              
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-slate-500">
                    No notifications yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {notifications.map((n) => (
                      <Link 
                        key={n.id}
                        to={`/incident/${n.incident_id}`}
                        onClick={() => setIsOpen(false)}
                        className={`block p-4 transition hover:bg-slate-800/50 ${!n.is_read ? 'bg-slate-800/20' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 rounded-full p-1.5 ${n.severity === 'Critical' ? 'bg-red-500/20 text-red-500' : 'bg-cyan-500/20 text-cyan-500'}`}>
                            <ShieldAlert className="size-4" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm ${!n.is_read ? 'font-semibold text-white' : 'text-slate-300'}`}>
                                {n.title}
                              </p>
                              {!n.is_read && (
                                <button 
                                  onClick={(e) => handleMarkRead(n.id, e)}
                                  className="text-slate-500 hover:text-white"
                                  title="Mark as read"
                                >
                                  <Check className="size-3.5" />
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 line-clamp-2">
                              {n.message}
                            </p>
                            <p className="text-[10px] text-slate-500 font-medium">
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
