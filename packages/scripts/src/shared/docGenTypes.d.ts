import { InputParameters } from '@chainlink/ea-bootstrap'
import { Transport } from '@chainlink/external-adapter-framework/transports'

export type Adapter = {
  name: string
  skipTests?: boolean
}

export type Blacklist = { blacklist: string[] }

export type BooleanMap = { [key: string]: boolean }

export type EndpointDetails = {
  [endpointName: string]: {
    batchablePropertyPath?: { name: string }[]
    supportedEndpoints: string[]
    inputParameters: InputParameters
    description?: string
    aliases?: string[] //v3 field
    name?: string //v3 field
    transport?: Transport //v3 field
  }
}

export type EnvVars = {
  [envVar: string]: {
    default?: string | number | boolean
    description?: string
    options?: readonly string[]
    type?: string
  }
}

export type RateLimits = {
  [tierName: string]: {
    rateLimit1s?: number
    rateLimit1m?: number
    rateLimit1h?: number
    note?: string
  }
}

export type RateLimitsSchema = {
  http: RateLimits
  ws: RateLimits
}

export type FileData = {
  path: string
  text: string
}

export type IOMap = { [endpoint: string]: IOPair[] }

type IOPair = {
  input: JsonObject
  output: JsonObject
}

export type JsonObject = { [key: string]: any }

export type MappedAdapters = {
  [name: string]: {
    readmeIsGenerated: boolean
    testsUpdated?: boolean
    endpointIndexUpdated?: boolean
  }
}

export type Package = {
  name?: string
  version?: string
  dependencies?: { [name: string]: string }
  license: string
}

export type Schema = {
  title?: string
  description?: string
  properties?: EnvVars
  required?: string[]
  allOf?: (
    | {
        $ref: string
      }
    | {
        anyOf: { required: string[] }[]
      }
  )[]
}
