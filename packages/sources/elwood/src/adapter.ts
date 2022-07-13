import { Builder, Validator } from '@chainlink/ea-bootstrap'
import {
  AdapterRequest,
  APIEndpoint,
  Config,
  ExecuteWithConfig,
  ExecuteFactory,
  MakeWSHandler,
} from '@chainlink/ea-bootstrap'
import { DEFAULT_WS_API_ENDPOINT, makeConfig } from './config'
import * as endpoints from './endpoint' // The endpoints must be exported as shown in endpoint/index.ts for README generation.

export const execute: ExecuteWithConfig<Config, endpoints.TInputParameters> = async (
  request,
  context,
  config,
) => {
  return Builder.buildSelector<Config, endpoints.TInputParameters>(
    request,
    context,
    config,
    endpoints,
  )
}

export const endpointSelector = (
  request: AdapterRequest,
): APIEndpoint<Config, endpoints.TInputParameters> =>
  Builder.selectEndpoint<Config, endpoints.TInputParameters>(request, makeConfig(), endpoints)

export const makeExecute: ExecuteFactory<Config, endpoints.TInputParameters> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}

export const makeWSHandler = (config?: Config): MakeWSHandler<any> => {
  // TODO: WS message types
  const getPair = (input: AdapterRequest<endpoints.price.TInputParameters>) => {
    const validator = new Validator(
      input,
      endpoints.price.inputParameters,
      {},
      { shouldThrowError: false },
    )
    if (validator.error) return ''
    const base = validator.validated.data.base.toUpperCase()
    const quote = validator.validated.data.quote.toUpperCase()
    return `${base}-${quote}`
  }

  return async () => {
    const wsConfig = config || makeConfig()

    return {
      connection: { url: DEFAULT_WS_API_ENDPOINT },
      onConnect: (): AuthenticationRequest => ({
        params: { apiKey: wsConfig.apiKey },
      }),
      noHttp: true,
      subscribe: (input: AdapterRequest<endpoints.price.TInputParameters>): SubscribeRequest => ({
        action: 'subscribe',
        stream: 'index',
        symbol: 'BTC-USD',
        index_freq: 1000,
      }),
      unsubscribe: (
        input: AdapterRequest<endpoints.price.TInputParameters>,
      ): UnsubscribeRequest => ({
        jsonrpc: '2.0',
        method: 'vwap_unsubscribe',
        params: { tickers: [getPair(input)] },
      }),
      subsFromMessage: (message: ResponseMessage, subscriptionMsg: SubscribeRequest) => {
        if (!('method' in message && message.method === 'vwap')) return
        const subInMessage = message.params.updates.find((u) =>
          subscriptionMsg.params.tickers?.includes(u.ticker),
        )
        if (!subInMessage) return
        return subscriptionMsg
      },
      toResponse: (
        message: PriceUpdateResponse,
        input: AdapterRequest<endpoints.price.TInputParameters>,
      ) => {
        const tickerUpdate = message.params.updates.find((u) => u.ticker === getPair(input)) || {}
        const result = Requester.validateResultNumber(tickerUpdate, ['price'])
        return Requester.success(input.id, { data: { result } }, wsConfig.verbose)
      },
      filter: (message: ResponseMessage) => 'method' in message && message.method === 'vwap',
      isError: (message: ResponseMessage) => 'error' in message,
    } as any // TODO: types
  }
}

// {
//   /** Hook to send a message after connection **/
//   onConnect?: (input: AdapterRequest) => Record<string, string>
//   /** Hook to send chain of onConnect messages **/
//   onConnectChain?: {
//     payload: string | Record<string, unknown>[]
//     filter?: (prevMessage: unknown) => boolean
//     shouldNeverUnsubscribe?: boolean
//   }[]
//   /** Get the subscription message necessary to subscribe to the feed channel **/
//   subscribe: (input: AdapterRequest) => MessageT | undefined
//   /** Modify subscription payload before sending to WS **/
//   modifySubscriptionPayload?: (
//     originalPayload: MessageT,
//     subscriptionParams: MessageT,
//     connectionParams: MessageT,
//     id: number,
//   ) => MessageT
//   /** Filter to whether or not modify subscription payload **/
//   shouldModifyPayload?: (payload: MessageT) => boolean
//   /** Get unsubscribe message necessary to unsubscribe to the feed channel **/
//   unsubscribe: (input: AdapterRequest, subscriptionParams: MessageT) => MessageT | undefined
//   /** Map to response from the incoming message and formats it into an AdapterResponse **/
//   toResponse: (
//     message: MessageT,
//     input: AdapterRequest,
//   ) => Promise<AdapterResponse> | AdapterResponse
//   /** Filter any message that is not from a subscribed channel **/
//   filter: (message: MessageT) => boolean
//   /** Determines if the incoming message is an error **/
//   isError: (message: MessageT) => boolean
//   /** Based on the incoming message, returns its corresponding subscription message **/
//   subsFromMessage: (
//     message: MessageT,
//     subscriptionMsg: MessageT,
//     input: AdapterRequest,
//     connectionParams?: MessageT,
//   ) => MessageT | undefined
//   /** Allows for connection info to be set programmatically based on the input request **/
//   /** This is useful for data providers that only allow subscriptions based on URL params **/
//   programmaticConnectionInfo?: (input: AdapterRequest) =>
//     | {
//         key: string
//         url: string
//       }
//     | undefined
//   /** Optional flag to ensure adapter only uses WS and doesn't send HTTP requests **/
//   noHttp?: boolean
//   /** This function is called if anything from the WS message needs to be saved in the Redux subscription store **/
//   toSaveFromFirstMessage?: (message: MessageT) => MessageT
//   /** Format message to save to the connection redux store **/
//   saveOnConnectToConnection?: (message: MessageT) => MessageT
//   /** Filters out messages that should be saved to the connection redux store **/
//   shouldSaveToConnection?: (message: MessageT) => boolean
//   /** Formats the heartbeat message that needs to be sent to the WS connecton **/
//   heartbeatMessage?: (id: number, connectionParams: MessageT) => MessageT
//   /** The interval between sending heartbeat messages **/
//   heartbeatIntervalInMS?: number
//   /** Filters out messages that are not expected from sending a message constructed by one of the onConnect hooks **/
//   isOnConnectChainMessage?: (message: MessageT) => boolean
//   /** Whether or not message is sent to subscribe to a pair/ticker **/
//   isDataMessage?: (message: MessageT) => boolean
//   /** Whether or not to reply to a heartbeat message from the server **/
//   shouldReplyToServerHeartbeat?: (message: MessageT) => boolean
//   /** The message that will be sent back to the WS server **/
//   heartbeatReplyMessage?: (message: MessageT, id: number, connectionParams: MessageT) => MessageT
//   /** Should try open connection again after error **/
//   shouldNotRetryConnection?: (error: unknown) => boolean
//   /** Should try resubscribing to a connection again after an error **/
//   shouldNotRetrySubscription?: (subscription: unknown) => boolean
//   /** Time to wait until adapter should handle next WS message **/
//   minTimeToNextMessageUpdateInS?: number
// }
