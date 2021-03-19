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
    data: any // Response data, holds "result" for Flux Monitor. Correct way.
    result: any // Result for OCR
    maxAge?: number
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
  export type Middleware = (execute: Execute, ...args: any) => Promise<Execute>
  export type Callback = (statusCode: number, data?: any) => void
  export type AdapterHealthCheck = (callback: Callback) => any

  // TODO: fix circular dependency
  // import type { RequestConfig } from '@chainlink/external-adapter'
  export type RequestConfig = any

  export type Config = {
    apiKey?: string
    network?: string
    returnRejectedPromiseOnError?: Boolean
    verbose?: boolean
    api: RequestConfig
  }

  export type ExecuteSync = (input: AdapterRequest, callback: Callback) => void

  export type Execute = (input: AdapterRequest) => Promise<AdapterResponse>

  export type ExecuteWithConfig<C extends Config> = (
    input: AdapterRequest,
    config: C,
  ) => Promise<AdapterResponse>

  export type ExecuteFactory<C extends Config> = (config?: C) => Execute

  export type ConfigFactory = (prefix?: string) => Config

  // TODO: fix circular dependency
  // import type { ExecuteHandlers } from '@chainlink/ea-bootstrap'
  type ExecuteHandlers = any
  export type AdapterImplementation = {
    NAME: string
    makeExecute: ExecuteFactory<Config>
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
}

declare module 'synthetix'
declare module 'object-path'
