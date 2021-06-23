import Ajv, { JSONSchemaType } from 'ajv'
import { readFileSync } from 'fs'
import { logger } from '../external-adapter'
import { getEnv } from '../util'

/**
 * The test payload read in from filesystem
 */
interface Payload {
  request: {
    [key: string]: any
  }
  variables: {
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
      variables: {
        type: 'object',
      },
    },
  }
  const validate = ajv.compile(schema)

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const payload = readFileSync('test-payload.json', 'utf-8')

    const parsedPayload: Payload = JSON.parse(payload)
    if (!validate(parsedPayload)) {
      throw Error(JSON.stringify(validate?.errors || 'Could not validate schema for test payload'))
    }

    replace(parsedPayload)

    return { ...parsedPayload, isDefault: false }
  } catch (e) {
    logger.warn(`Could not load payload: ${(e as Error).message}`)
    logger.warn('Falling back to default empty payload')
    return { isDefault: true }
  }
}

/**
 * Replaces variable strings that are marked with $...$
 * (e.g. $testVariable$)
 *
 * 1. First "variables" of the fixture will be searched
 * 2. Use a tuple for Replace Mode. If the first index is found the second will be returned.
 * 3. If not found there the environment will be searched
 *
 */
const variableRegex = /[#]\w+[#]/g
const environmentRegex = /[$]\w+[$]/g

function replace(payload: Payload) {
  const variables = payload.variables
  let request = JSON.stringify(payload.request)

  const variablesToReplace = new Map(
    (request.match(variableRegex) || []).map((match, i) => [i, match]),
  )
  const fillFromVariable = (variable: string) => {
    if (variables[variable]) {
      for (const value of variables[variable]) {
        if (Array.isArray(value)) {
          const [test, replace] = value
          const fromEnv = getEnv(test.slice(1, -1))
          if (fromEnv) return replace
        } else {
          if (environmentRegex.test(value)) {
            const fromEnv = getEnv(value.slice(1, -1))
            if (fromEnv) return fromEnv
          } else return value
        }
      }
    }
    return variable
  }
  variablesToReplace.forEach((value) => {
    const fill = fillFromVariable(value)
    request = request.replace(value, fill)
  })

  const envToReplace = new Map(
    (request.match(environmentRegex) || []).map((match, i) => [i, match]),
  )
  const fillFromEnv = (variable: string) => getEnv(variable.slice(1, -1)) || ''
  envToReplace.forEach((value) => {
    console.log(value)
    request = request.replace(value, fillFromEnv(value))
  })

  payload.request = JSON.parse(request)
}
