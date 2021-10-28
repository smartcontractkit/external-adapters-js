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
    name?: string
    apiKey?: string
    wsApiKey?: string
    network?: string
    returnRejectedPromiseOnError?: boolean
    verbose?: boolean
    api?: RequestConfig
    defaultEndpoint?: string
    adapterSpecificParams?: {
      [T: string]: string | number
    }
    rpcUrl?: string
    rpcPort?: number
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

  export interface APIEndpoint<C extends Config = Config> {
    supportedEndpoints: string[]
    batchablePropertyPath?: BatchableProperty[]
    endpointResultPaths?: EndpointResultPaths
    inputParameters?: InputParameters
    endpointOverride?: (request: AdapterRequest) => string | null
    execute?: Execute | ExecuteWithConfig<C>
    makeExecute?: ExecuteFactory<C>
  }

  export type ResultPath = string | (number | string)[]
  export type MakeResultPath = (input: AdapterRequest) => ResultPath
  export type MakeResultPathFactory = (path: string) => MakeResultPath

  export interface EndpointResultPaths {
    [endpoint: string]: ResultPath | MakeResultPath
  }

  export type ConfigFactory<C extends Config = Config> = (prefix?: string) => C

  import type { ExecuteHandlers } from '@chainlink/ea-bootstrap'
  import { BatchableProperty } from '../../bootstrap/dist/lib/cache-warmer/reducer'
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
  export interface WebsocketErrorMessageSchema {
    type: string
    wasClean: boolean
    reason: string
    code: number
  }
  export interface WSHandler {
    // Connection information
    connection: {
      /**
       * WS connection url
       */
      url?: string
      getUrl?: (input: AdapterRequest) => Promise<string>
      protocol?: any
    }
    // Determines whether or not to server request using WS
    shouldNotServeInputUsingWS?: (input: AdapterRequest) => boolean
    // Hook to send a message after connection
    onConnect?: (input: AdapterRequest) => any
    // Hook to send chain of onConnect messages
    onConnectChain?: {
      payload: any
      filter?: (prevMessage: any) => boolean
      shouldNeverUnsubscribe?: boolean
    }[]
    // Get the subscription message necessary to subscribe to the feed channel
    subscribe: (input: AdapterRequest) => any | undefined
    // Modify subscription payload before sending to WS
    modifySubscriptionPayload?: (
      originalPayload: any,
      subscriptionParams: any,
      connectionParams: any,
      id: number,
    ) => any
    // Filter to whether or not modify subscription payload
    shouldModifyPayload?: (payload: any) => bool
    // Get unsubscribe message necessary to unsubscribe to the feed channel
    unsubscribe: (input: any, subscriptionParams: any) => any | undefined
    // Map to response from the incoming message and formats it into an AdapterResponse
    toResponse: (message: any, input: AdapterRequest) => Promise<AdapterResponse> | AdapterResponse
    // Filter any message that is not from a subscribed channel
    filter: (message: any) => boolean
    // Determines if the incoming message is an error
    isError: (message: any) => boolean
    // Based on the incoming message, returns its corresponding subscription message
    subsFromMessage: (
      message: any,
      subscriptionMsg: any,
      input: AdapterRequest,
      connectionParams?: any,
    ) => any
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
    // This function is called if anything from the WS message needs to be saved in the Redux subscription store
    toSaveFromFirstMessage?: (message: any) => any
    // Format message to save to the connection redux store
    saveOnConnectToConnection?: (message: any) => any
    // Filters out messages that should be saved to the connection redux store
    shouldSaveToConnection?: (message: any) => boolean
    // Formats the heartbeat message that needs to be sent to the WS connecton
    heartbeatMessage?: (id: number, connectionParams: any) => any
    // The interval between sending heartbeat messages
    heartbeatIntervalInMS?: number
    // Filters out messages that are not expected from sending a message constructed by one of the onConnect hooks
    isOnConnectChainMessage?: (message: any) => boolean
    // Whether or not message is sent to subscribe to a pair/ticker
    isDataMessage?: (message: unknown) => boolean
    // Whether or not to reply to a heartbeat message from the server
    shouldReplyToServerHeartbeat?: (message: unknown) => boolean
    // The message that will be sent back to the WS server
    heartbeatReplyMessage?: (message: unknown, id: number, connectionParams: any) => unknown
    // Should try open connection again after error
    shouldNotRetryConnection?: (error: unknown) => boolean
    // Should try resubscribing to a connection again after an error
    shouldNotRetrySubscription?: (subscription: unknown) => boolean
  }

  /* INPUT TYPE VALIDATIONS */
  export type Override = Map<string, Map<string, string>>

  // Includes is an alternative symbol mapping that can be used to represent
  // the original request, such as wrapped tokens on DEXes.
  export type IncludePair = {
    from: string // From symbol
    to: string // To symbol
    adapters?: string[] // Array of adapters this applies to
    inverse?: boolean // If the inverse should be calculated instead
    tokens?: boolean // If the token addresses should be used instead
  }

  export type Includes = {
    from: string
    to: string
    includes: IncludePair[]
  }
}

declare module 'object-path'
declare module 'lodash'
