import { generateSchemas } from 'common/bin/schema-utils'

generateSchemas([
  { inputFile: './src/models/*.ts', outputFile: './schemas/iot-entities.json', type: '*' },
  { inputFile: './src/apis/iot.ts', outputFile: './schemas/iot-api.json', type: '*' },
]).catch((error) => {
  console.error('IoT schema generation failed', error)
  process.exit(1)
})
