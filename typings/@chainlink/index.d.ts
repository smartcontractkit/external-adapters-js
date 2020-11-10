// Declare missing type definitions
declare module '@chainlink/types' {
  export type AdapterRequest = { id: string; data: Record<string, unknown>; meta?: Record<string, unknown> }
  export type AdapterResponse = {
    jobRunID: string
    statusCode: number
    data: any
    result: any
  }

  // TODO: clean this ASAP
  export type WrappedAdapterResponse = {
    statusCode: number
    data: AdapterResponse
  }

  export type Execute = (input: AdapterRequest, config?: any) => Promise<AdapterResponse>
}
declare module '@chainlink/ea-bootstrap'
declare module '@chainlink/external-adapter'
declare module 'object-path'
