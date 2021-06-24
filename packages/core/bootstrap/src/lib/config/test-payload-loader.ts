import Ajv, { JSONSchemaType } from 'ajv'
import { logger } from '../external-adapter'
import path from 'path'

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
    let payload
    try {
      payload = require(path.join(process.cwd(), 'test-payload.js'))
    } catch (error) {
      payload = require(path.join(process.cwd(), 'test-payload.json'))
    }

    const parsedPayload: Payload = JSON.parse(payload)
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
