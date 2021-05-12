import Ajv, { JSONSchemaType } from 'ajv'
import { readFileSync } from 'fs'
import { logger } from '../external-adapter'

/**
 * The test payload read in from filesystem
 */
interface Payload {
  request: {
    [key: string]: any
  }
}

/**
 * Test payload with discriminated union so we can tell when we should just do
 * a simple liveness check rather than a sample request
 */
type TestPayload = (Payload & { isDefault: false }) | { isDefault: true }

/**
 * Load in a JSON file containing a test payload for the current adapter,
 * used in healthchecks to make sample requests
 */
export function loadTestPayload(): TestPayload {
  const ajv = new Ajv()
  const schema: JSONSchemaType<Payload> = {
    type: 'object',
    required: ['request'],
    properties: {
      request: {
        type: 'object',
      },
    },
  }
  const validate = ajv.compile(schema)

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const payload = readFileSync('test-payload.json', 'utf-8')
    const parsedPayload = JSON.parse(payload)
    if (!validate(parsedPayload)) {
      throw Error(JSON.stringify(validate?.errors || 'Could not validate schema for test payload'))
    }

    return { ...parsedPayload, isDefault: false }
  } catch (e) {
    logger.warn(`Could not load payload: ${(e as Error).message}`)
    logger.warn('Falling back to default empty payload')
    return { isDefault: true }
  }
}
