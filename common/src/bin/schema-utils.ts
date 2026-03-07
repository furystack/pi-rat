import { promises } from 'fs'
import { join } from 'path'
import { createGenerator } from 'ts-json-schema-generator'

export interface SchemaGenerationSetting {
  inputFile: string
  outputFile: string
  type: string
}

export const generateSchemas = async (settings: SchemaGenerationSetting[]): Promise<void> => {
  await Promise.all(
    settings.map(async (schemaValue) => {
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

        if (schema.definitions) {
          schema.definitions = Object.fromEntries(
            Object.entries(schema.definitions).sort(([a], [b]) => a.localeCompare(b)),
          )
        }

        await promises.writeFile(outputFile, JSON.stringify(schema, null, 2))
        console.log(`Schema generated succesfully.`)
      } catch (error) {
        console.error(`There was an error generating schema from ${schemaValue.inputFile}`, error)
        throw error
      }
    }),
  )
}
