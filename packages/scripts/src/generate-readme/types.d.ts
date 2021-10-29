export type AdapterPackage = {
  name: string
  version: string
}

export type AdapterSchema = {
  properties: SchemaProperties
  required: SchemaRequired
  type: string
}

export type JsonObject = Record<string, unknown>

export type MaxColChars = number[]

export type SchemaProperties = {
  [key: string]: {
    default?: string | number
    enum?: (string | number)[]
    type?: string
  }
}

export type SchemaRequired = string[]

export type TableText = string[][]

export type TextRow = string[]
