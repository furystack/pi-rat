import { generateSchemas, type SchemaGenerationSetting } from './schema-utils.js'

const entityValues: SchemaGenerationSetting[] = [
  { inputFile: './src/models/ai/*.ts', outputFile: './schemas/ai-entities.json', type: '*' },
  { inputFile: './src/models/chat/*.ts', outputFile: './schemas/chat-entities.json', type: '*' },
  { inputFile: './src/models/config/*.ts', outputFile: './schemas/config-entities.json', type: '*' },
  { inputFile: './src/models/dashboard/*.ts', outputFile: './schemas/dashboard-entities.json', type: '*' },
  { inputFile: './src/models/drives/*.ts', outputFile: './schemas/drives-entities.json', type: '*' },
  { inputFile: './src/models/identity/*.ts', outputFile: './schemas/identity-entities.json', type: '*' },
  { inputFile: './src/models/install/*.ts', outputFile: './schemas/install-entitis.json', type: '*' },
  { inputFile: './src/models/media/*.ts', outputFile: './schemas/media-entities.json', type: '*' },
  { inputFile: './src/models/logging/*.ts', outputFile: './schemas/logging-entities.json', type: '*' },
]

const apiValues: SchemaGenerationSetting[] = [
  { inputFile: './src/apis/ai.ts', outputFile: './schemas/ai-api.json', type: '*' },
  { inputFile: './src/apis/chat.ts', outputFile: './schemas/chat-api.json', type: '*' },
  { inputFile: './src/apis/config.ts', outputFile: './schemas/config-api.json', type: '*' },
  { inputFile: './src/apis/dashboards.ts', outputFile: './schemas/dashboards-api.json', type: '*' },
  { inputFile: './src/apis/drives.ts', outputFile: './schemas/drives-api.json', type: '*' },
  { inputFile: './src/apis/identity.ts', outputFile: './schemas/identity-api.json', type: '*' },
  { inputFile: './src/apis/install.ts', outputFile: './schemas/install-api.json', type: '*' },
  { inputFile: './src/apis/logging.ts', outputFile: './schemas/logging-api.json', type: '*' },
  { inputFile: './src/apis/media.ts', outputFile: './schemas/media-api.json', type: '*' },
]

generateSchemas([...entityValues, ...apiValues]).catch((error) => {
  console.error('Schema generation failed', error)
  process.exit(1)
})
