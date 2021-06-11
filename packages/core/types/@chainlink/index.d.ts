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

  export type AdapterDebug = {
    ws?: boolean
    cacheHit?: boolean
    staleness?: number
    performance?: number
    providerCost?: number
    batchable?: string
  }

  /**
   * Meta info that pertains to exposing metrics
   */
  export interface AdapterMetricsMeta {
    feedId: string
  }

  import { BigNumberish } from 'ethers'
  export type AdapterRequest = {
    id: string
    data: Record<string, BigNumberish | BigNumberish[] | { [key: string]: BigNumberish }>
    meta?: AdapterRequestMeta
    metricsMeta?: AdapterMetricsMeta
    debug?: AdapterDebug
    rateLimitMaxAge?: number
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
    metricsMeta?: AdapterMetricsMeta
    debug?: AdapterDebug
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

  export type { AxiosResponse, RequestConfig } from 'axios'

  export type Config = {
    apiKey?: string
    network?: string
    returnRejectedPromiseOnError?: boolean
    verbose?: boolean
    api?: RequestConfig
  }

  export type ExecuteSync = (input: AdapterRequest, callback: Callback) => void

  export type Execute = (input: AdapterRequest) => Promise<AdapterResponse>

  export type ExecuteWithConfig<C extends Config> = (
    input: AdapterRequest,
    config: C,
  ) => Promise<AdapterResponse>

  export type ExecuteFactory<C extends Config> = (config?: C) => Execute

  export type ConfigFactory = (prefix?: string) => Config

  import type { ExecuteHandlers } from '@chainlink/ea-bootstrap'
  type ExecuteHandlers = ExecuteHandlers
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

  export type MakeWSHandler = () => WSHandler | Promise<WSHandler>
  export interface WSHandler {
    // Connection information
    connection: {
      /**
       * WS connection url
       */
      url: string
      protocol?: any
    }
    // Get the subscription message necessary to subscribe to the feed channel
    subscribe: (input: AdapterRequest) => any | undefined
    // Get unsubscribe message necessary to unsubscribe to the feed channel
    unsubscribe: (input: any) => any | undefined
    // Map to response from the incoming message and formats it into an AdapterResponse
    toResponse: (message: any) => AdapterResponse
    // Filter any message that is not from a subscribed channel
    filter: (message: any) => boolean
    // Determines if the incoming message is an error
    isError: (message: any) => boolean
    // Based on the incoming message, returns its corresponding subscription message
    subsFromMessage: (message: any) => any
  }

  /* INPUT TYPE VALIDATIONS */
  export type Override = Map<string, Map<string, string>>
}

declare module 'object-path'
declare module 'lodash'
