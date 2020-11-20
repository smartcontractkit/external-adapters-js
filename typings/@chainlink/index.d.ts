// Declare missing type definitions
declare module '@chainlink/types' {
  export type AdapterRequest = {
    id: string
    data: Record<string, unknown>
    meta?: Record<string, unknown>
  }

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

  import { AxiosRequestConfig } from 'axios'
  export type Config = {
    apiKey?: string
    api: Partial<AxiosRequestConfig>
  }

  export type Execute = (input: AdapterRequest) => Promise<AdapterResponse>
  export type ExecuteWithConfig = (
    input: AdapterRequest,
    config: Config,
  ) => Promise<AdapterResponse>
  export type ExecuteFactory = (config: Config) => Execute

  export type Account = {
    address: string
    coin?: CoinType
    chain?: ChainType
    balance?: number
  }
}
declare module '@chainlink/ea-bootstrap'
declare module '@chainlink/external-adapter'
declare module 'object-path'
