// Declare missing type definitions
declare module '@chainlink/types' {
  /* REQUESTS */
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

  import { AxiosRequestConfig } from 'axios'
  export type Config = {
    apiKey?: string
    network?: string
    returnRejectedPromiseOnError?: Boolean
    verbose?: boolean
    api: Partial<AxiosRequestConfig>
  }

  /* RESPONSES */
  export type DataResponse<R, P> = {
    result: R
    payload?: P
  }

  export type SequenceResponseData<R> = {
    responses?: any[]
    result: R[]
  }

  export type AdapterResponse = {
    jobRunID: string
    statusCode: number
    data: any
    result: any
  }

  /* ERRORS */
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

  /* BOOTSTRAP */
  export type ExecuteSync = (input: AdapterRequest, callback: Callback) => void

  export type Execute = (input: AdapterRequest) => Promise<AdapterResponse>

  export type ExecuteWithConfig<C extends Config> = (
    input: AdapterRequest,
    config: C,
  ) => Promise<AdapterResponse>

  export type ExecuteFactory<C extends Config> = (config?: C) => Execute

  export type ConfigFactory = (prefix?: string) => Config

  import type { ExecuteHandlers } from '@chainlink/ea-bootstrap/src'
  export type AdapterImplementation = {
    NAME: string
    makeExecute: ExecuteFactory
    makeConfig: ConfigFactory
  } & ExecuteHandlers

  /* IMPLEMENTATIONS */
  export type Address = {
    address: string
  }
  export type Account = Address & {
    balance?: string
    coin?: string
    chain?: string
    warning?: string
  }

  /* INPUT TYPE VALIDATIONS */
  export type Override = Map<string, Map<string, string>>

}
declare module '@chainlink/ea-bootstrap'
declare module '@chainlink/external-adapter'
declare module 'synthetix'
declare module 'object-path'
