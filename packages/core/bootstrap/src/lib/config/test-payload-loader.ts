import Ajv, { JSONSchemaType } from 'ajv'
import { logger } from '../external-adapter'
import path from 'path'
import { AdapterRequestData } from '@chainlink/types'

/**
 * The test payload read in from filesystem
 */
export interface Payload {
  requests: AdapterRequestData[]
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
    required: ['requests'],
    properties: {
      requests: {
        type: 'array',
        items: {
          type: 'object',
          required: []
        },
      },
    },
  }
  const validate = ajv.compile(schema)

  try {
    let payload

    const payloadString = resolveDynamicPayload()
    if (payloadString) payload = JSON.parse(payloadString)
    else payload = resolveStaticPayload()

    if (!validate(payload)) {
      throw Error(JSON.stringify(validate?.errors || 'Could not validate schema for test payload'))
    }

    return { ...payload, isDefault: false }
  } catch (e) {
    logger.warn(`Could not load payload: ${(e as Error).message}`)
    logger.warn('Falling back to default empty payload')
    return { isDefault: true }
  }
}

function resolveDynamicPayload(): string | null {
  /* eslint-disable @typescript-eslint/no-var-requires */
  try {
    // Absolute path for JS file
    return require(path.resolve('.', 'test-payload.js'))
  } catch {
    try {
      // Relative path for JS file
      return require('./test-payload.js')
    } catch {
      return null
    }
  }
}

function resolveStaticPayload(): Payload | null {
  try {
    // Absolute path for JSON file
    return require(path.join(process.cwd(), 'test-payload.json'))
  } catch {
    try {
      // Relative path for JSON file
      return require('./test-payload.json')
    } catch {
      return null
    }
  }
}
