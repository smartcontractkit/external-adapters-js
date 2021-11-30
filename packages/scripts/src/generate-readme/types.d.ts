export type Blacklist = {
  blacklist: string[]
}

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
    enum?: (string | number)[]
    type?: string
  }
}

type InputParameter = {
  aliases?: InputParameterAliases
  description?: string
  type?: 'bigint' | 'boolean' | 'array' | 'number' | 'object' | 'string'
  required?: RequiredInputParameter
  options?: any[]
  default?: any
  dependsOn?: string[]
  exclusive?: string[]
}

type InputParameters = {
  [name: string]: RequiredInputParameter | InputParameterAliases | InputParameter
}

type InputParameterAliases = string[]

export type IOMap = Record<string, IOPair[]>

type IOPair = {
  input: JsonObject
  output: JsonObject
}

export type JsonObject = Record<string, any>

export type MaxColChars = number[]

export type Package = {
  name: string
  version: string
}

type RequiredInputParameter = boolean

export type Schema = {
  description?: string
  properties: EnvVars
  required: string[]
}

export type TableText = string[][]

export type TextRow = string[]
