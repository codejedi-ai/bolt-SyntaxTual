import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAuthenticatedSupabaseClient, type AgentTemplate } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { AgentAssembler } from '@/lib/agentAssembler'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
import DashboardLayout from '@/components/DashboardLayout'
import { ArrowLeft, Save, FileCode, Sparkles } from 'lucide-react'

const DEFAULT_YAML = `name: my-agent
description: A custom AI agent
version: v1

agent:
  type: chatbot
  model:
    provider: openai
    name: gpt-4

  personality:
    tone: professional
    style: helpful

  system_prompt: |
    You are a helpful AI assistant.
    Provide clear and accurate responses.

  capabilities:
    - conversation
    - question_answering

  memory:
    enabled: true
    max_history: 10
`

export default function CreateAgentPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState<AgentTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [name, setName] = useState('')
  const [yamlConfig, setYamlConfig] = useState(DEFAULT_YAML)
  const [parseError, setParseError] = useState<string>('')
  const [generatedCode, setGeneratedCode] = useState<string>('')

  useEffect(() => {
    loadTemplates()
  }, [])

  useEffect(() => {
    validateAndGenerateCode()
  }, [yamlConfig])

  const loadTemplates = async () => {
    try {
      const supabase = await getAuthenticatedSupabaseClient()
      const { data, error } = await supabase
        .from('agent_templates')
        .select('*')
        .eq('is_public', true)

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setSelectedTemplate(templateId)
      setYamlConfig(template.yaml_template)
      setName(template.name)
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
      setGeneratedCode('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (parseError) {
      alert('Please fix YAML errors before saving')
      return
    }

    setLoading(true)

    try {
      if (!user) {
        navigate('/login')
        return
      }

      const config = AgentAssembler.parseYAML(yamlConfig)
      const supabase = await getAuthenticatedSupabaseClient()

      const { data, error } = await supabase
        .from('agents')
        .insert({
          user_id: user.uid,
          name: name || config.name,
          description: config.description || '',
          yaml_config: yamlConfig,
          config_version: config.version,
          agent_type: config.agent.type,
          code: generatedCode,
          model_provider: config.agent.model.provider,
          model_name: config.agent.model.name,
          status: 'draft'
        })
        .select()
        .single()

      if (error) throw error

      navigate(`/agent/${data.id}`)
    } catch (error) {
      console.error('Error creating agent:', error)
      alert('Failed to create agent. Please try again.')
    } finally {
      setLoading(false)
    }
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

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 text-transparent bg-clip-text">
            Create AI Agent
          </h1>
          <p className="text-white/70">Define your agent using YAML configuration (Agent-as-Code)</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                Start from Template
              </CardTitle>
              <CardDescription>Choose a pre-built template or start from scratch</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                <SelectTrigger className="bg-gray-900/50 border-gray-700">
                  <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {template.agent_type}
                        </Badge>
                        <span>{template.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-blue-400" />
                  YAML Configuration
                </CardTitle>
                <CardDescription>
                  Define your agent behavior with YAML
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
              <CardContent>
                <div className="mb-4">
                  <Label htmlFor="name">Agent Name (Optional)</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Leave empty to use name from YAML"
                    className="bg-gray-900/50 border-gray-700"
                  />
                </div>
                <div className="rounded-lg overflow-hidden border border-gray-700">
                  <CodeMirror
                    value={yamlConfig}
                    height="500px"
                    theme={vscodeDark}
                    extensions={[javascript()]}
                    onChange={(value) => setYamlConfig(value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  Generated Code
                </CardTitle>
                <CardDescription>
                  Assembled code from your YAML configuration
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generatedCode ? (
                  <div className="rounded-lg overflow-hidden border border-gray-700">
                    <CodeMirror
                      value={generatedCode}
                      height="580px"
                      theme={vscodeDark}
                      extensions={[javascript()]}
                      editable={false}
                    />
                  </div>
                ) : (
                  <div className="h-[580px] flex items-center justify-center text-white/50">
                    Fix YAML errors to see generated code
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={loading || !!parseError}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Creating...' : 'Create Agent'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
