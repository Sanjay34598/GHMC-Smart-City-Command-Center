import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Loader2, BrainCircuit } from 'lucide-react'
import { getCoordinationStatus, triggerCoordination, type AgentStatusUpdate } from '@/lib/incidents'

function AgentCard({ agent }: { agent: AgentStatusUpdate }) {
  const isThinking = agent.status === 'thinking'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-slate-700/80 bg-slate-900/60 p-5 relative overflow-hidden"
    >
      {/* Animated background gradient for thinking state */}
      {isThinking && (
        <motion.div
          animate={{ x: ['-100%', '100%'] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent"
        />
      )}
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BrainCircuit className="size-4 text-cyan-400" />
            <h4 className="font-semibold text-slate-200">{agent.agent_type}</h4>
          </div>
          {isThinking ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
              <Loader2 className="size-3.5 animate-spin" />
              Thinking...
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <CheckCircle2 className="size-3.5" />
              Completed
            </span>
          )}
        </div>
        
        {/* Agent Payload Display */}
        {agent.payload && (
          <div className="space-y-3 mt-4 text-sm text-slate-300">
            {Object.entries(agent.payload).map(([key, value]) => (
              <div key={key}>
                <span className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">
                  {key.replace(/_/g, ' ')}
                </span>
                {Array.isArray(value) ? (
                  <div className="flex flex-wrap gap-2">
                    {(value as unknown[]).map((v, i) => (
                      <span key={i} className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-xs text-blue-300">
                        {String(v)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="font-medium">{String(value)}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export function AICoordinationPanel({ incidentId }: { incidentId: string }) {
  const [agents, setAgents] = useState<AgentStatusUpdate[]>([])
  const [phase, setPhase] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  useEffect(() => {
    let alive = true

    async function load() {
      setPhase('loading')
      try {
        let res = await getCoordinationStatus(incidentId)
        if (res.agents.length === 0) {
          res = await triggerCoordination(incidentId)
        }
        
        if (alive) {
          setAgents(res.agents)
          setPhase('done')
        }
      } catch {
        if (alive) setPhase('error')
      }
    }

    load()
    return () => { alive = false }
  }, [incidentId])

  if (phase === 'error') {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 mt-8">
        <p className="text-sm text-red-300">Failed to load multi-agent coordination data.</p>
      </div>
    )
  }

  if (phase === 'loading') {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-900/60 p-5 mt-8 text-cyan-300">
        <Loader2 className="size-5 animate-spin" />
        <span className="text-sm font-semibold">Initializing Multi-Agent Coordination…</span>
      </div>
    )
  }

  return (
    <div className="space-y-4 mt-8">
      <div className="flex items-center gap-2 mb-6 border-b border-slate-700/50 pb-4">
        <BrainCircuit className="size-6 text-cyan-400" />
        <h3 className="text-xl font-bold text-white tracking-tight">AI Coordination Center</h3>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-1 xl:grid-cols-2">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  )
}
