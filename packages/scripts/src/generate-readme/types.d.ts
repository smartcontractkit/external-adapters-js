import { InputParameters } from '@chainlink/types'

export type Blacklist = {
  blacklist: string[]
}

export type BooleanMap = Record<string, boolean>

export type EndpointDetails = {
  [endpointName: string]: {
    supportedEndpoints: string[]
    inputParameters: InputParameters
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

export type IOMap = Record<string, IOPair[]>

type IOPair = {
  input: JsonObject
  output: JsonObject
}

export type JsonObject = Record<string, any>

export type MaxColChars = number[]

export type Package = {
  name?: string
  version?: string
}

export type Schema = {
  description?: string
  properties?: EnvVars
  required?: string[]
}

export type TableText = string[][]

export type TextRow = string[]
