import { join } from 'path'
import { promises } from 'fs'
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
  {
    inputFile: './src/apis/torrent.ts',
    outputFile: './schemas/torrent-api.json',
    type: '*',
  },
]

export const exec = async (): Promise<void> => {
  for (const schemaValue of [...entityValues, ...apiValues]) {
    try {
      console.log(`Create schema from ${schemaValue.inputFile} to ${schemaValue.outputFile}`)
      const schema = createGenerator({
        path: join(process.cwd(), schemaValue.inputFile),
        tsconfig: join(process.cwd(), './tsconfig.json'),
        skipTypeCheck: true,
        expose: 'all',
      }).createSchema(schemaValue.type)
      await promises.writeFile(join(process.cwd(), schemaValue.outputFile), JSON.stringify(schema, null, 2))
    } catch (error) {
      console.error(`There was an error generating schema from ${schemaValue.inputFile}`, error)
      process.exit(1)
    }
  }
}

exec()
