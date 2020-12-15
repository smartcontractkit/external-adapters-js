// Declare missing type definitions
declare module '@chainlink/types' {
  export type AdapterRequestMeta = {
    availableFunds?: number
    eligibleToSubmit?: boolean
    latestAnswer?: number
    oracleCount?: number
    paymentAmount?: number
    reportableRoundID?: number
    startedAt?: number
    timeout?: number
  }
  export type AdapterRequest = {
    id: string
    data: Record<string, unknown>
    meta?: AdapterRequestMeta
  }

  export type Callback = (statusCode: number, data?: any) => void
  export type AdapterHealthCheck = (callback: Callback) => any

  export type AdapterResponse = {
    jobRunID: string
    statusCode: number
    data: any
    result: any
  }

  type ErrorBasic = {
    name: string
    message: string
  }
  type ErrorFull = ErrorBasic & {
    stack: string
    cause: string
  }
  export type AdapterErrorResponse = {
    jobRunID: string
    status: string
    statusCode: number
    error: ErrorBasic | ErrorFull
  }

  // TODO: clean this ASAP
  export type WrappedAdapterResponse = {
    statusCode: number
    data: AdapterResponse
  }
  export type ExecuteWrappedResponse = (input: AdapterRequest) => Promise<WrappedAdapterResponse>

  export type ExecuteSync = (input: AdapterRequest, callback: Callback) => void

  import { AxiosRequestConfig } from 'axios'
  export type Config = {
    apiKey?: string
    network?: string
    returnRejectedPromiseOnError?: Boolean
    api: Partial<AxiosRequestConfig>
  }

  export type Execute = (input: AdapterRequest) => Promise<AdapterResponse>

  export type ExecuteWithConfig = (
    input: AdapterRequest,
    config: Config,
  ) => Promise<AdapterResponse>

  export type ExecuteFactory<C extends Config> = (config?: C) => Execute

  import { expose } from '@chainlink/ea-bootstrap'
  export type AdapterImplementation = {
    NAME: string
    makeExecute: ExecuteFactory
  } & ReturnType<expose>
  export interface Implementations<t> {
    [type: string]: AdapterImplementation
  }

  export type Account = {
    address: string
    coin?: CoinType
    chain?: ChainType
    balance?: number
  }

  export type DNSResponseAnswer = {
    name: string
    type: number
    TTL: number
    data: string
  }
}
declare module '@chainlink/ea-bootstrap'
declare module '@chainlink/external-adapter'
declare module 'object-path'
declare module '@chainlink/ea-factories'
