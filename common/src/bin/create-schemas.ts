import { promises } from 'fs'
import { join } from 'path'
import { createGenerator } from 'ts-json-schema-generator'

export interface SchemaGenerationSetting {
  inputFile: string
  outputFile: string
  type: string
}

/**
 * Entity schemas, e.g. User, Session, etc...
 */
export const entityValues: SchemaGenerationSetting[] = [
  {
    inputFile: './src/models/chat/*.ts',
    outputFile: './schemas/chat-entities.json',
    type: '*',
  },
  {
    inputFile: './src/models/config/*.ts',
    outputFile: './schemas/config-entities.json',
    type: '*',
  },
  {
    inputFile: './src/models/dashboard/*.ts',
    outputFile: './schemas/dashboard-entities.json',
    type: '*',
  },
  {
    inputFile: './src/models/drives/*.ts',
    outputFile: './schemas/drives-entities.json',
    type: '*',
  },
  {
    inputFile: './src/models/identity/*.ts',
    outputFile: './schemas/identity-entities.json',
    type: '*',
  },
  {
    inputFile: './src/models/install/*.ts',
    outputFile: './schemas/install-entitis.json',
    type: '*',
  },
  {
    inputFile: './src/models/iot/*.ts',
    outputFile: './schemas/iot-entities.json',
    type: '*',
  },
  {
    inputFile: './src/models/media/*.ts',
    outputFile: './schemas/media-entities.json',
    type: '*',
  },
]

export const apiValues: SchemaGenerationSetting[] = [
  {
    inputFile: './src/apis/ai.ts',
    outputFile: './schemas/ai-api.json',
    type: '*',
  },
  {
    inputFile: './src/apis/chat.ts',
    outputFile: './schemas/chat-api.json',
    type: '*',
  },
  {
    inputFile: './src/apis/config.ts',
    outputFile: './schemas/config-api.json',
    type: '*',
  },
  {
    inputFile: './src/apis/dashboards.ts',
    outputFile: './schemas/dashboards-api.json',
    type: '*',
  },
  {
    inputFile: './src/apis/drives.ts',
    outputFile: './schemas/drives-api.json',
    type: '*',
  },
  {
    inputFile: './src/apis/identity.ts',
    outputFile: './schemas/identity-api.json',
    type: '*',
  },
  {
    inputFile: './src/apis/install.ts',
    outputFile: './schemas/install-api.json',
    type: '*',
  },
  {
    inputFile: './src/apis/iot.ts',
    outputFile: './schemas/iot-api.json',
    type: '*',
  },
  {
    inputFile: './src/apis/media.ts',
    outputFile: './schemas/media-api.json',
    type: '*',
  },
]

export const exec = async (): Promise<void> => {
  await Promise.all(
    [...entityValues, ...apiValues].map(async (schemaValue) => {
      try {
        const inputFile = join(process.cwd(), schemaValue.inputFile)
        const outputFile = join(process.cwd(), schemaValue.outputFile)

        console.log(`Create schema from ${inputFile} to ${outputFile}`)
        const schema = createGenerator({
          path: inputFile,
          tsconfig: join(process.cwd(), './tsconfig.json'),
          skipTypeCheck: true,
          expose: 'all',
        }).createSchema(schemaValue.type)
        await promises.writeFile(outputFile, JSON.stringify(schema, null, 2))
        console.log(`Schema generated succesfully.`)
      } catch (error) {
        console.error(`There was an error generating schema from ${schemaValue.inputFile}`, error)
        throw error
      }
    }),
  )
}

exec().catch((error) => {
  console.error('Schema generation failed', error)
  process.exit(1)
})
