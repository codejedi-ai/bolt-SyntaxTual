import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { type Agent, getAuthenticatedSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Settings, Trash2, ExternalLink } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/hooks/useAuth'

export default function DashboardPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      loadAgents()
    }
  }, [user])

  const loadAgents = async () => {
    try {
      const supabase = await getAuthenticatedSupabaseClient()
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) throw error
      setAgents(data || [])
    } catch (error) {
      console.error('Error loading agents:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteAgent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return

    try {
      const supabase = await getAuthenticatedSupabaseClient()
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', id)

      if (error) throw error
      setAgents(agents.filter(a => a.id !== id))
    } catch (error) {
      console.error('Error deleting agent:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'deployed': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'active': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-12 px-4">
          <div className="text-center">Loading...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-12 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 text-transparent bg-clip-text">
              Agent Dashboard
            </h1>
            <p className="text-white/70">Manage your AI agents (Agent-as-Code)</p>
          </div>
          <Button
            onClick={() => navigate('/create-agent')}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Agent
          </Button>
        </div>

        {agents.length === 0 ? (
          <Card className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-700">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Plus className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No agents yet</h3>
              <p className="text-white/70 mb-6">Create your first AI agent to get started with AAC</p>
              <Button
                onClick={() => navigate('/create-agent')}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Agent
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map(agent => (
              <Card
                key={agent.id}
                className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-700 hover:border-blue-500/50 transition-all"
              >
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-xl">{agent.name}</CardTitle>
                    <Badge className={getStatusColor(agent.status)}>
                      {agent.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-white/60">
                    {agent.description || 'No description'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {agent.agent_type}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {agent.config_version}
                      </Badge>
                    </div>
                    <div className="text-sm">
                      <span className="text-white/50">Provider:</span>{' '}
                      <span className="text-white/90">{agent.model_provider}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-white/50">Model:</span>{' '}
                      <span className="text-white/90">{agent.model_name}</span>
                    </div>
                    {agent.deployment_url && (
                      <div className="text-sm">
                        <a
                          href={agent.deployment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                          View Deployment <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/agent/${agent.id}`)}
                      className="flex-1"
                    >
                      <Settings className="mr-1 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteAgent(agent.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
