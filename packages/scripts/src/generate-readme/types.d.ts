export type AdapterPackage = {
  name: string
  version: string
}

export type AdapterSchema = {
  description?: string
  properties: {
    [key: string]: {
      default?: string | number
      enum?: (string | number)[]
      type?: string
    }
  }
  required: string[]
}

export type EndpointDetails = {
  [endpointName: string]: {
    supportedEndpoints: string[]
    inputParameters: {
      [inputName: string]: string[] | boolean
    }
  }
}

export type IOMap = Record<string, IOPair[]>

export type IOPair = {
  input: JsonObject
  output: JsonObject
}

export type JsonObject = Record<string, any>

export type MaxColChars = number[]

export type TableText = string[][]

export type TextRow = string[]
