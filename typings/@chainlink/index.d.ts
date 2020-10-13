// Declare missing type definitions
declare module '@chainlink/types' {
  export type AdapterRequest = { id: string; data: Record<string, unknown> }
  export type AdapterResponse = { statusCode: number; data: Record<string, unknown> }
}
declare module '@chainlink/ea-bootstrap'
declare module '@chainlink/external-adapter'
declare module 'object-path'
