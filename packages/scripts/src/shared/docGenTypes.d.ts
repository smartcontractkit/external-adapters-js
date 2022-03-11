import { InputParameters } from '@chainlink/types'

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
  }
}

export type EnvVars = {
  [envVar: string]: {
    default?: string | number
    description?: string
    options?: (string | number)[]
    type?: string
  }
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
}

export type Schema = {
  title?: string
  description?: string
  properties?: EnvVars
  required?: string[]
}
