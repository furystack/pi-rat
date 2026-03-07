import { promises } from 'fs'
import { join } from 'path'
import { createGenerator } from 'ts-json-schema-generator'

const settings = [
  { inputFile: './src/models/*.ts', outputFile: './schemas/iot-entities.json', type: '*' },
  { inputFile: './src/apis/iot.ts', outputFile: './schemas/iot-api.json', type: '*' },
]

const exec = async () => {
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

exec().catch((error) => {
  console.error('IoT schema generation failed', error)
  process.exit(1)
})
