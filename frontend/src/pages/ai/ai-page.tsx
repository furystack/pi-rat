import { createComponent, Shade } from '@furystack/shades'
import { Paper } from '@furystack/shades-common-components'
import { AiChat } from './ai-chat.js'
import { AiModelSelector } from './ai-model-selector.js'

export const AiPage = Shade({
  shadowDomName: 'pi-rat-ai-page',
  style: {
    marginTop: '48px',
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '100%',
    width: '100%',
    height: 'calc(100% - 48px)',
    gap: '16px',
    overflow: 'hidden',
  },
  render: ({ useSearchState }) => {
    const [aiModel, setAiModel] = useSearchState('aiModel', 'ollama')
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: '1', width: '100%', height: '100%' }}>
        <Paper style={{ display: 'flex', flexDirection: 'row', width: 'calc(100% - 48px)', flexGrow: '0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flexGrow: '1', flex: '5' }}>
            <h1>AI Page</h1>
            <p>This is the AI page where you can interact with AI models.</p>
          </div>
          <AiModelSelector value={aiModel} onSelect={setAiModel} style={{ flexGrow: '0', flex: '1' }} />
        </Paper>
        <AiChat model={aiModel} />
      </div>
    )
  },
})
