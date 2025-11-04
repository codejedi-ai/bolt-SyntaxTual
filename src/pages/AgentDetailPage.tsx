import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getAuthenticatedSupabaseClient, type Agent, type AgentDeployment } from '@/lib/supabase'
import { AgentAssembler } from '@/lib/agentAssembler'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
import DashboardLayout from '@/components/DashboardLayout'
import { ArrowLeft, Save, Rocket, History, FileCode, Sparkles } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function AgentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deploying, setDeploying] = useState(false)
  const [agent, setAgent] = useState<Agent | null>(null)
  const [deployments, setDeployments] = useState<AgentDeployment[]>([])

  const [name, setName] = useState('')
  const [yamlConfig, setYamlConfig] = useState('')
  const [parseError, setParseError] = useState<string>('')
  const [generatedCode, setGeneratedCode] = useState('')

  useEffect(() => {
    loadAgent()
    loadDeployments()
  }, [id])

  useEffect(() => {
    if (yamlConfig) {
      validateAndGenerateCode()
    }
  }, [yamlConfig])

  const loadAgent = async () => {
    try {
      const supabase = await getAuthenticatedSupabaseClient()
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (error) throw error
      if (!data) {
        navigate('/dashboard')
        return
      }

      setAgent(data)
      setName(data.name)
      setYamlConfig(data.yaml_config || '')
      setGeneratedCode(data.code || '')
    } catch (error) {
      console.error('Error loading agent:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadDeployments = async () => {
    try {
      const supabase = await getAuthenticatedSupabaseClient()
      const { data, error } = await supabase
        .from('agent_deployments')
        .select('*')
        .eq('agent_id', id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDeployments(data || [])
    } catch (error) {
      console.error('Error loading deployments:', error)
    }
  }

  const validateAndGenerateCode = () => {
    try {
      const config = AgentAssembler.parseYAML(yamlConfig)
      const code = AgentAssembler.assembleToCode(config)
      setGeneratedCode(code)
      setParseError('')
    } catch (error) {
      setParseError(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  const handleSave = async () => {
    if (parseError) {
      alert('Please fix YAML errors before saving')
      return
    }

    setSaving(true)

    try {
      const config = AgentAssembler.parseYAML(yamlConfig)
      const supabase = await getAuthenticatedSupabaseClient()

      const { error } = await supabase
        .from('agents')
        .update({
          name,
          description: config.description,
          yaml_config: yamlConfig,
          config_version: config.version,
          agent_type: config.agent.type,
          code: generatedCode,
          model_provider: config.agent.model.provider,
          model_name: config.agent.model.name
        })
        .eq('id', id)

      if (error) throw error

      alert('Agent saved successfully!')
      loadAgent()
    } catch (error) {
      console.error('Error saving agent:', error)
      alert('Failed to save agent. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeploy = async () => {
    setDeploying(true)

    try {
      if (!user) throw new Error('Not authenticated')
      
      const supabase = await getAuthenticatedSupabaseClient()
      const { data, error } = await supabase
        .from('agent_deployments')
        .insert({
          agent_id: id,
          user_id: user.uid,
          deployment_status: 'pending'
        })
        .select()
        .single()

      if (error) throw error

      alert('Deployment initiated! Check the Deployments tab for status.')
      loadDeployments()
    } catch (error) {
      console.error('Error deploying agent:', error)
      alert('Failed to deploy agent. Please try again.')
    } finally {
      setDeploying(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': case 'deployed': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'deploying': case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
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
      <div className="container mx-auto py-12 px-4 max-w-7xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 text-transparent bg-clip-text">
              {agent?.name}
            </h1>
            <p className="text-white/70">{agent?.description || 'No description'}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline">{agent?.agent_type}</Badge>
              <Badge variant="outline">{agent?.config_version}</Badge>
            </div>
          </div>
          <Badge className={getStatusColor(agent?.status || 'draft')}>
            {agent?.status}
          </Badge>
        </div>

        <Tabs defaultValue="yaml" className="space-y-6">
          <TabsList className="bg-gray-900/50">
            <TabsTrigger value="yaml">YAML Config</TabsTrigger>
            <TabsTrigger value="code">Generated Code</TabsTrigger>
            <TabsTrigger value="deployments">Deployments</TabsTrigger>
          </TabsList>

          <TabsContent value="yaml" className="space-y-6">
            <Card className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-blue-400" />
                  Agent Configuration
                </CardTitle>
                <CardDescription>
                  Edit your agent's YAML configuration
                  {parseError && (
                    <div className="mt-2 text-red-400 text-sm">
                      Error: {parseError}
                    </div>
                  )}
                  {!parseError && generatedCode && (
                    <div className="mt-2 text-green-400 text-sm">
                      Configuration valid
                    </div>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Agent Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-gray-900/50 border-gray-700"
                  />
                </div>

                <div className="rounded-lg overflow-hidden border border-gray-700">
                  <CodeMirror
                    value={yamlConfig}
                    height="600px"
                    theme={vscodeDark}
                    extensions={[javascript()]}
                    onChange={(value) => setYamlConfig(value)}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                onClick={handleSave}
                disabled={saving || !!parseError}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                onClick={handleDeploy}
                disabled={deploying || !!parseError}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Rocket className="mr-2 h-4 w-4" />
                {deploying ? 'Deploying...' : 'Deploy Agent'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="code">
            <Card className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  Generated Code
                </CardTitle>
                <CardDescription>
                  Code assembled from your YAML configuration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg overflow-hidden border border-gray-700">
                  <CodeMirror
                    value={generatedCode}
                    height="700px"
                    theme={vscodeDark}
                    extensions={[javascript()]}
                    editable={false}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deployments">
            <Card className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5 text-green-400" />
                  Deployment History
                </CardTitle>
                <CardDescription>View all deployments for this agent</CardDescription>
              </CardHeader>
              <CardContent>
                {deployments.length === 0 ? (
                  <div className="text-center py-8 text-white/60">
                    No deployments yet. Deploy your agent to see history here.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {deployments.map(deployment => (
                      <div
                        key={deployment.id}
                        className="p-4 rounded-lg bg-gray-900/50 border border-gray-700"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-sm text-white/60">
                            {new Date(deployment.created_at).toLocaleString()}
                          </div>
                          <Badge className={getStatusColor(deployment.deployment_status)}>
                            {deployment.deployment_status}
                          </Badge>
                        </div>
                        {deployment.deployment_url && (
                          <div className="text-sm mb-2">
                            <span className="text-white/50">URL:</span>{' '}
                            <a
                              href={deployment.deployment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300"
                            >
                              {deployment.deployment_url}
                            </a>
                          </div>
                        )}
                        {deployment.error_message && (
                          <div className="text-sm text-red-400">
                            Error: {deployment.error_message}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
