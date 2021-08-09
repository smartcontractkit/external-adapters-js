// Declare missing type definitions
declare module '@chainlink/types' {
  import type { Cache, RateLimit } from '@chainlink/ea-bootstrap'
  import { cacheWarmer } from '@chainlink/ea-bootstrap'

  export interface AdapterContext {
    name?: string
    cache?: Cache.CacheOptions
    rateLimit?: RateLimit.config.Config
  }

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
    warmer?: boolean
    cacheHit?: boolean
    staleness?: number
    performance?: number
    providerCost?: number
    batchablePropertyPath?: cacheWarmer.reducer.BatchableProperty[]
    normalizedRequest?: Record<string, unknown>
  }

  /**
   * Meta info that pertains to exposing metrics
   */
  export interface AdapterMetricsMeta {
    feedId: string
  }

  import { BigNumberish } from 'ethers'
  export type AdapterRequestData = Record<
    string,
    BigNumberish | BigNumberish[] | AdapterRequestData
  >
  export type AdapterRequest = {
    id: string
    data: AdapterRequestData
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
  export type Middleware = (
    execute: Execute,
    context: AdapterContext,
    ...args: any
  ) => Promise<Execute>
  export type Callback = (statusCode: number, data?: any) => void
  export type AdapterHealthCheck = (callback: Callback) => any

  export type { AxiosResponse, RequestConfig } from 'axios'

  export type Config = {
    apiKey?: string
    network?: string
    returnRejectedPromiseOnError?: boolean
    verbose?: boolean
    api?: RequestConfig
    defaultEndpoint?: string
  }

  export type Execute = (input: AdapterRequest, context: AdapterContext) => Promise<AdapterResponse>
  export type ExecuteSync = (
    input: AdapterRequest,
    execute: Execute,
    context: AdapterContext,
    callback: Callback,
  ) => void

  export type ExecuteWithConfig<C extends Config> = (
    input: AdapterRequest,
    context: AdapterContext,
    config: C,
  ) => Promise<AdapterResponse>

  export type ExecuteFactory<C extends Config> = (config?: C) => Execute

  export type RequiredInputParameter = boolean
  export type InputParameterAliases = string[]
  export type InputParameters = {
    [name: string]: RequiredInputParameter | InputParameterAliases
  }

  export interface APIEndpoint {
    supportedEndpoints: string[]
    batchablePropertyPath?: BatchableProperty[]
    endpointResultPaths?: EndpointResultPaths
    inputParameters?: InputParameters
    endpointOverride?: (request: AdapterRequest) => string | null
    execute?: Execute | ExecuteWithConfig<Config>
    makeExecute?: ExecuteFactory<Config>
  }

  export type MakeResultPath = (input: AdapterRequest) => string

  export interface EndpointResultPaths {
    [endpoint: string]: MakeResultPath | string
  }

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
    // Hook to send a message after connection
    onConnect?: () => any
    // Get the subscription message necessary to subscribe to the feed channel
    subscribe: (input: AdapterRequest) => any | undefined
    // Get unsubscribe message necessary to unsubscribe to the feed channel
    unsubscribe: (input: any) => any | undefined
    // Map to response from the incoming message and formats it into an AdapterResponse
    toResponse: (message: any, input: AdapterRequest) => AdapterResponse
    // Filter any message that is not from a subscribed channel
    filter: (message: any) => boolean
    // Determines if the incoming message is an error
    isError: (message: any) => boolean
    // Based on the incoming message, returns its corresponding subscription message
    subsFromMessage: (message: any, subscriptionMsg: any) => any
    // Allows for connection info to be set programmatically based on the input request
    // This is useful for data providers that only allow subscriptions based on URL params
    programmaticConnectionInfo?: (input: AdapterRequest) =>
      | {
          key: string
          url: string
        }
      | undefined
    // Optional flag to ensure adapter only uses WS and doesn't send HTTP requests
    noHttp?: boolean
  }

  /* INPUT TYPE VALIDATIONS */
  export type Override = Map<string, Map<string, string>>

  // Includes is an alternative symbol mapping that can be used to represent
  // the original request, such as wrapped tokens on DEXes.
  export type Includes = {
    from: string // From symbol
    to: string // To symbol
    adapters?: string[] // Array of adapters this applies to
    inverse?: boolean // If the inverse should be calculated instead
    tokens?: boolean // If the token addresses should be used instead
  }
}

declare module 'object-path'
declare module 'lodash'
