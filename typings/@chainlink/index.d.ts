// Declare missing type definitions
declare module '@chainlink/types' {
  export type AdapterRequest = { id: string; data: Record<string, unknown> }
  export type AdapterResponse = {
    jobRunID: string
    statusCode: number
    data: Record<string, unknown>
    error?: any
  }
  export type Execute = (input: AdapterRequest) => Promise<AdapterResponse>
}
declare module '@chainlink/ea-bootstrap'
declare module '@chainlink/external-adapter'
declare module 'object-path'
