// Declare missing type definitions
declare module '@chainlink/types' {
  export type AdapterRequest = { id: string; data: Record<string, unknown> }
  export type AdapterResponse = { statusCode: number; data: Record<string, unknown> }
}
declare module '@chainlink/ea-bootstrap'
declare module '@chainlink/external-adapter'
declare module 'object-path'
declare module '@chainlink/reduce'
declare module '@chainlink/blockchain.com'
declare module '@chainlink/blockcypher'
declare module '@chainlink/renvm-address-set'
declare module '@chainlink/wbtc-address-set'
