export enum ConnectionType {
  AUTO = 0,
  STREAMING = 1,
  POLLING = 2,
  LONGPOLLING = 3,
}

export interface StreamingClientConfig {
  host: string
  failoverHosts: string[]
  behavior: ConnectionType //POLLING, LONGPOLLING, AUTO, STREAMING
  pollingInterval: number // ms
  usergroup: string
  password: string

  // Optional parameters
  headers?: Record<string, string>
  timeoutMs?: number
  reconnectInterval?: number
  connectingTimeoutMs?: number
}
