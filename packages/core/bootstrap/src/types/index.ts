export type ExternalAdapter = {
  execute: Execute
  makeWsHandler?: MakeWSHandler
  endpointSelector?: (request: AdapterRequest) => APIEndpoint
}

export type ExecuteHandler = {
  server: () => Promise<import('fastify').FastifyInstance>
}

export interface AdapterContext {
  name?: string
  cache?: import('../lib/middleware/cache/types').CacheOptions
  envDefaultOverrides?: EnvDefaultOverrides
  rateLimit?: import('../lib/config/provider-limits').Limits
  limits?: import('../lib/config/provider-limits/config').Config
  ip?: string
  host?: string
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

export interface BatchableProperty {
  name: string
  limit?: number
}

export type AdapterDebug = {
  cacheKey?: string
  batchCacheKey?: string
  batchChildrenCacheKeys?: [string, AdapterRequest][]
  ws?: boolean
  warmer?: boolean
  cacheHit?: boolean
  staleness?: number
  performance?: number
  providerCost?: number
  batchablePropertyPath?: BatchableProperty[]
  normalizedRequest?: Record<string, unknown>
}

/**
 * Meta info that pertains to exposing metrics
 */
export type AdapterMetricsMeta = {
  feedId: string
}

export type Bytes = ArrayLike<number>
export interface Hexable {
  toHexString(): string
}
export type BigNumberish = BigNumber | Bytes | bigint | string | number
export type BigNumber = Hexable & {
  readonly _hex: string
  // constructor(constructorGuard: unknown, hex: string): void
  readonly _isBigNumber: boolean
  fromTwos(value: number): BigNumber
  toTwos(value: number): BigNumber
  abs(): BigNumber
  add(other: BigNumberish): BigNumber
  sub(other: BigNumberish): BigNumber
  div(other: BigNumberish): BigNumber
  mul(other: BigNumberish): BigNumber
  mod(other: BigNumberish): BigNumber
  pow(other: BigNumberish): BigNumber
  and(other: BigNumberish): BigNumber
  or(other: BigNumberish): BigNumber
  xor(other: BigNumberish): BigNumber
  mask(value: number): BigNumber
  shl(value: number): BigNumber
  shr(value: number): BigNumber
  eq(other: BigNumberish): boolean
  lt(other: BigNumberish): boolean
  lte(other: BigNumberish): boolean
  gt(other: BigNumberish): boolean
  gte(other: BigNumberish): boolean
  isNegative(): boolean
  isZero(): boolean
  toNumber(): number
  toBigInt(): bigint
  toString(): string
  toHexString(): string
  toJSON(key?: string): unknown
  from(value: unknown): BigNumber
  isBigNumber(value: unknown): value is BigNumber
}
export type Value = BigNumberish | Array<BigNumberish> | boolean | undefined
/**
 * Pseudo-unknown type
 *
 * Allows 3 levels of nesting
 */
export type NestableValue =
  | Value
  | Record<string, Value>
  | Record<string, Record<string, Value>>
  | Record<string, Value | Record<string, Value> | Record<string, Value>[]>[] // "includes" type
  | AdapterBatchResponse
  | Record<string, unknown> // generic object

export type AdapterData = {
  [key: string]: NestableValue
}

export type TBaseInputParameters = {
  endpoint?: string
  resultPath?: ResultPath
  overrides?: OverrideRecord
  tokenOverrides?: { [network: string]: { [token: string]: string } }
  includes?: Includes[] | string[]
  maxAge?: number
  cost?: number
  error?: { code: number }
}

export type AdapterRequestData<TData extends AdapterData = AdapterData> = TData &
  TBaseInputParameters

export type AdapterRequest<TData extends AdapterData = AdapterData> = {
  id: string
  data: AdapterRequestData<TData>
  meta?: AdapterRequestMeta
  metricsMeta?: AdapterMetricsMeta
  debug?: AdapterDebug
}
export interface AdapterRequestWithRateLimit extends AdapterRequest {
  rateLimitMaxAge?: number
}

/* RESPONSES */
export type DataResponse<R = Value, P = unknown> = {
  result: R
  payload?: P
}
export type SequenceResponseData<R> = {
  responses?: AdapterData[]
  result: R[]
}

export type Telemetry = {
  rateLimitEnabled: boolean
  wsEnabled: boolean
  cacheEnabled: boolean
  cacheType?: string
  cacheWarmingEnabled: boolean
  cacheMaxAge?: string
  metricEnabled: boolean
  rateLimitApiTier?: string
  requestCoalescingEnabled: boolean
  dataProviderRequestTime?: number
}

export type AdapterBatchResponse = [string, AdapterRequest, number][]
/**
 * Contained within the body of an api response
 * from a request that asked for multiple data points
 *
 * @example Request Parameters
 * ```
 * {
 *  "data": {
 *      "base": ["ETH", "BTC"],
 *      "quote": "USD"
 *   }
 *}
 * ```
 */
export type BatchedResult = {
  /**
   * Tuples for
   *
   * [
   *    its input parameters as a single request (used in caching),
   *    its result
   * ]
   */
  results?: AdapterBatchResponse
}

export type AdapterResponseData<TData extends AdapterData = AdapterData> =
  AdapterRequestData<TData> &
    BatchedResult & {
      result?: Value
      statusCode: number
    }

export type AdapterResponse<TData extends AdapterData = AdapterData> = {
  jobRunID: string
  statusCode: number
  data: AdapterResponseData<TData> // Response data, holds "result" for Flux Monitor. Correct way.
  result: Value // Result for OCR
  maxAge?: number
  telemetry?: Telemetry
  metricsMeta?: AdapterMetricsMeta
  debug?: AdapterDebug
  providerStatusCode?: number
}

/* ERRORS */
export type ErrorBasic = {
  name: string
  message: string
}
export type ErrorFull = ErrorBasic & {
  stack: string
  cause: string
}

export type AdapterErrorLog = {
  jobRunID: string
  params: AdapterData
  type: string
  message: string
  feedID: string
  url?: string
  errorResponse?: string | Record<string, string>
  rawError?: string
  stack?: string
  ip?: string
  host?: string
}

export type AdapterErrorResponse = {
  jobRunID: string
  status: string
  statusCode: number
  providerStatusCode?: number
  error: ErrorBasic | ErrorFull
}

/* BOOTSTRAP */
export type Middleware<TInput = AdapterRequest, TContext = AdapterContext> = (
  execute: Execute<TInput, TContext>,
  context: TContext,
  ...args: unknown[]
) => Promise<Execute<TInput, TContext>>

export type Callback = (statusCode: number, data?: AdapterResponse | AdapterErrorResponse) => void

import type { AxiosResponse, AxiosRequestConfig, AxiosRequestHeaders, Method } from 'axios'
export { AxiosResponse, AxiosRequestConfig, AxiosRequestHeaders, Method }
export interface WSConfig {
  baseWsURL?: string
}
export type Config = {
  name?: string
  apiKey?: string
  wsApiKey?: string
  network?: string
  returnRejectedPromiseOnError?: boolean
  verbose?: boolean
  api?: AxiosRequestConfig
  ws?: WSConfig
  defaultEndpoint?: string
  adapterSpecificParams?: {
    [T: string]: string | number
  }
  rpcUrl?: string
  rpcPort?: number
  chainId?: number | string
}
export interface DefaultConfig extends Config {
  verbose: boolean
  api: AxiosRequestConfig
  ws: {
    baseWsURL?: string
  }
}

export type EnvDefaults = { [name: string]: string }

/**
 * To add a default override for an env var not present here,
 * ensure that the adapter context from `expose` is passed
 * to the `getEnv` call(s) for the variable in question. See
 * `WS_ENABLED` for example usage.
 */
export type EnvDefaultOverrides = {
  API_TIMEOUT?: string
  CACHE_ENABLED?: 'true' | 'false'
  WS_ENABLED?: 'true' | 'false'
  WARMUP_ENABLED?: 'true' | 'false'
}

export type Execute<
  Input = AdapterRequest,
  C = AdapterContext,
  Output extends AdapterData = AdapterData,
> = (input: Input, context: C) => Promise<AdapterResponse<Output>>

export type ExecuteSync = <D extends AdapterData>(
  input: AdapterRequest<D>,
  execute: Execute<AdapterRequest<D>>,
  context: AdapterContext,
  callback: Callback,
) => void

export type ExecuteWithConfig<C extends Config, D extends AdapterData = AdapterData> = (
  input: AdapterRequest<D>,
  context: AdapterContext,
  config: C,
) => Promise<AdapterResponse>

export type ExecuteFactory<
  C extends Config,
  Input extends AdapterData = AdapterData,
  Output extends AdapterData = AdapterData,
> = (config?: C) => Execute<AdapterRequest<Input>, AdapterContext, Output>

export type InputParameter<T extends AdapterData = AdapterData> = {
  aliases?: string[]
  description?: string
  type?: 'bigint' | 'boolean' | 'array' | 'number' | 'object' | 'string' // These are js type checked in the Validator
  required?: boolean
  options?: T[keyof T][] // enumerated options, ex. ['ADA', 'BTC', 'ETH']
  default?: T[keyof T]
  dependsOn?: (keyof T)[] // other inputs this one depends on
  exclusive?: (keyof T)[] // other inputs that cannot be present with this one
}

export type LegacyInputParameter = Array<string> | boolean
export type InputParameters<T extends AdapterData = AdapterData> = {
  [Property in keyof T]: InputParameter<T> | LegacyInputParameter
}

export interface APIEndpoint<C extends Config = Config, D extends AdapterData = AdapterData> {
  supportedEndpoints: string[]
  batchablePropertyPath?: BatchableProperty[]
  endpointResultPaths?: EndpointResultPaths
  inputParameters?: InputParameters<D>
  endpointOverride?: (request: AdapterRequest) => string | null
  execute?: Execute | ExecuteWithConfig<C, D>
  makeExecute?: ExecuteFactory<C>
}

type upstreamEndpointName = string
type inputPropertyName = string
export type UpstreamEndpointsGroup<C extends Config = Config> = [
  inputPropertyName,
  { [adapterName: string]: Record<string, APIEndpoint<C>> },
  upstreamEndpointName,
]

export type ResultPath = string | (number | string)[]
export type MakeResultPath = (input: AdapterRequest) => ResultPath
export type MakeResultPathFactory = (path: string) => MakeResultPath

export interface EndpointResultPaths {
  [endpoint: string]: ResultPath | MakeResultPath
}

export type ConfigFactory<C extends Config = Config> = (prefix?: string) => C

export type AdapterImplementation<
  C extends Config = Config,
  Input extends AdapterData = AdapterData,
  Output extends AdapterData = AdapterData,
> = {
  NAME: string
  makeExecute: ExecuteFactory<C, Input, Output>
  makeConfig: ConfigFactory<C>
  endpoints?: { [endpoint: string]: APIEndpoint<C, Input> }
} & ExecuteHandler

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

export type MakeWSHandler<MessageT = UnknownWSMessage> = () =>
  | WSHandler<MessageT>
  | Promise<WSHandler<MessageT>>
export interface WebsocketErrorMessageSchema {
  type: string
  wasClean: boolean
  reason: string
  code: number
}

export type UnknownWSMessage = string | Record<string, unknown> | Record<string, unknown>[]

export interface WSHandler<MessageT = UnknownWSMessage> {
  /** Connection information **/
  connection: {
    /**
     * WS connection url
     */
    url?: string
    getUrl?: (input: AdapterRequest) => Promise<string>
    protocol?: string | string[]
  }
  /** Determines whether or not to server request using WS **/
  shouldNotServeInputUsingWS?: (input: AdapterRequest) => boolean
  /** Hook to send a message after connection **/
  onConnect?: (input: AdapterRequest) => Record<string, string>
  /** Hook to send chain of onConnect messages **/
  onConnectChain?: {
    payload: string | Record<string, unknown>[]
    filter?: (prevMessage: unknown) => boolean
    shouldNeverUnsubscribe?: boolean
  }[]
  /** Get the subscription message necessary to subscribe to the feed channel **/
  subscribe: (input: AdapterRequest) => MessageT | undefined
  /** Modify subscription payload before sending to WS **/
  modifySubscriptionPayload?: (
    originalPayload: MessageT,
    subscriptionParams: MessageT,
    connectionParams: MessageT,
    id: number,
  ) => MessageT
  /** Filter to whether or not modify subscription payload **/
  shouldModifyPayload?: (payload: MessageT) => boolean
  /** Get unsubscribe message necessary to unsubscribe to the feed channel **/
  unsubscribe: (input: AdapterRequest, subscriptionParams: MessageT) => MessageT | undefined
  /** Map to response from the incoming message and formats it into an AdapterResponse **/
  toResponse: (
    message: MessageT,
    input: AdapterRequest,
  ) => Promise<AdapterResponse> | AdapterResponse
  /** Filter any message that is not from a subscribed channel **/
  filter: (message: MessageT) => boolean
  /** Determines if the incoming message is an error **/
  isError: (message: MessageT) => boolean
  /** Based on the incoming message, returns its corresponding subscription message **/
  subsFromMessage: (
    message: MessageT,
    subscriptionMsg: MessageT,
    input: AdapterRequest,
    connectionParams?: MessageT,
  ) => MessageT | undefined
  /** Allows for connection info to be set programmatically based on the input request **/
  /** This is useful for data providers that only allow subscriptions based on URL params **/
  programmaticConnectionInfo?: (input: AdapterRequest) =>
    | {
        key: string
        url: string
      }
    | undefined
  /** Optional flag to ensure adapter only uses WS and doesn't send HTTP requests **/
  noHttp?: boolean
  /** This function is called if anything from the WS message needs to be saved in the Redux subscription store **/
  toSaveFromFirstMessage?: (message: MessageT) => MessageT
  /** Format message to save to the connection redux store **/
  saveOnConnectToConnection?: (message: MessageT) => MessageT
  /** Filters out messages that should be saved to the connection redux store **/
  shouldSaveToConnection?: (message: MessageT) => boolean
  /** Formats the heartbeat message that needs to be sent to the WS connecton **/
  heartbeatMessage?: (id: number, connectionParams: MessageT) => MessageT
  /** The interval between sending heartbeat messages **/
  heartbeatIntervalInMS?: number
  /** Filters out messages that are not expected from sending a message constructed by one of the onConnect hooks **/
  isOnConnectChainMessage?: (message: MessageT) => boolean
  /** Whether or not message is sent to subscribe to a pair/ticker **/
  isDataMessage?: (message: MessageT) => boolean
  /** Whether or not to reply to a heartbeat message from the server **/
  shouldReplyToServerHeartbeat?: (message: MessageT) => boolean
  /** The message that will be sent back to the WS server **/
  heartbeatReplyMessage?: (message: MessageT, id: number, connectionParams: MessageT) => MessageT
  /** Should try open connection again after error **/
  shouldNotRetryConnection?: (error: unknown) => boolean
  /** Should try resubscribing to a connection again after an error **/
  shouldNotRetrySubscription?: (subscription: unknown) => boolean
  /** Time to wait until adapter should handle next WS message **/
  minTimeToNextMessageUpdateInS?: number
}

/* INPUT TYPE VALIDATIONS */
export type OverrideMap = Map<string, Map<string, string>>
export type OverrideRecord = Record<string, Record<string, string>>

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

// Used by the Overrider class to map from symbols to coin ids
export interface CoinsResponse {
  id: string
  symbol: string
  name: string
}

export type BasePairInputParameters = {
  base: string | string[]
  quote: string | string[]
}

export type PairOptionsMap<TOptions> = {
  [base: string]: { [quote: string]: TOptions }
}

import objectPath from 'object-path'
export { objectPath }
