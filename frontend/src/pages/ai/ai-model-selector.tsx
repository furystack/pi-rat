import { createComponent, Shade } from '@furystack/shades'
import { AiModelService } from './ai-model-service.js'

export const AiModelSelector = Shade<{ value?: string; onSelect?: (newValue: string) => void }>({
  shadowDomName: 'pi-rat-ai-model-selector',
  style: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    padding: '16px',
    boxSizing: 'border-box',
  },
  render: ({ injector, useObservable, props }) => {
    const aiModelsService = injector.getInstance(AiModelService)

    const [models] = useObservable('models', aiModelsService.getModelsAsObservable())

    if (models?.value) {
      return (
        <select
          onchange={(e) => {
            const target = e.target as HTMLSelectElement
            const newValue = target.value
            if (newValue && models.value?.result.some((model) => model.name === newValue)) {
              if (props.onSelect) {
                props.onSelect(newValue)
              }
            }
          }}
        >
          {models.value.result.map((model) => (
            <option value={model.name} selected={props.value === model.name}>
              {model.name}
            </option>
          ))}
        </select>
      )
    }

    return null
  },
})
