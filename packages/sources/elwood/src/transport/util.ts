import axios from 'axios'
import { makeLogger } from '@chainlink/external-adapter-framework/util'

export type SubscribeRequest = {
  action: 'subscribe' | 'unsubscribe'
  stream: 'index'
  symbol: string
  index_freq: number
}

export type PriceResponse = {
  type: 'Index'
  data: {
    price: string
    bid: string
    ask: string
    symbol: string
    timestamp: string
  }
  sequence: number
}

export type HeartbeatResponse = {
  type: 'heartbeat'
  data: string
  sequence: number
}

export type ErrorResponse = {
  type: unknown
  error: Record<string, unknown>
}

export type ResponseMessage = PriceResponse | HeartbeatResponse

export type LoggerType = ReturnType<typeof makeLogger>

export interface ValidatedWsMessage {
  base: string
  quote: string
  result: number
  bid: number
  ask: number
  timestamp: number
}

export const buildUrl = (endpoint: string, apiKey: string) => `${endpoint}?apiKey=${apiKey}`

export const validateWsMessage = (
  logger: LoggerType,
  message: ResponseMessage,
): ValidatedWsMessage | null => {
  if (message.type !== 'Index') {
    return null
  }

  if (!message.data) {
    logger.warn(`Got no data in WS message of type Index`)
    return null
  }

  if (typeof message.data?.symbol !== 'string') {
    logger.warn(`Got non string symbol "${message.data?.symbol}" in WS message of type Index`)
    return null
  }

  const [base, quote] = message.data.symbol.split('-')
  if (!base || !quote) {
    logger.warn(`Got invalid symbol "${message.data?.symbol}" in WS message of type Index`)
    return null
  }

  const result = Number(message.data.price)
  if (result < 0) {
    logger.warn(`Got invalid price "${message.data.price}" in WS message of type Index`)
    return null
  }

  return {
    base,
    quote,
    result,
    bid: Number(message.data.bid),
    ask: Number(message.data.ask),
    timestamp: new Date(message.data.timestamp).getTime(),
  }
}

export const buildWsMessage = (
  action: 'subscribe' | 'unsubscribe',
  params: { base: string; quote: string },
): SubscribeRequest => ({
  action,
  stream: 'index',
  symbol: `${params.base}-${params.quote}`,
  index_freq: 1_000, // Milliseconds
})

export const sendMessage = async (endpoint: string, apiKey: string, message: SubscribeRequest) =>
  axios.request({
    url: buildUrl(endpoint, apiKey),
    method: 'post',
    data: message,
  })

type Subscription = {
  index_freq: number
  stream: string
  symbol: string
}

type SubscriptionsSuccessResponse = {
  data: {
    items: (Subscription | string)[]
  }
}

type SubscriptionsResponse = SubscriptionsSuccessResponse | ErrorResponse

export const getSubscriptionKey = (subscription: Subscription): string =>
  `${subscription.stream}:${subscription.symbol}:${subscription.index_freq}`

export const getSubscriptions = async (
  endpoint: string,
  apiKey: string,
  logger: LoggerType,
): Promise<Set<string>> => {
  let data: SubscriptionsResponse
  try {
    const response = await axios.get<SubscriptionsResponse>(
      buildUrl(`${endpoint}/subscriptions`, apiKey),
    )
    data = response.data
  } catch (e) {
    logger.warn(`Failed to get current subscriptions, assuming no subscriptions: ${e}`)
    return new Set()
  }

  if ('error' in data) {
    logger.warn(
      `Subscriptions response has error, assuming no subscriptions: ${JSON.stringify(data.error)}`,
    )
    return new Set()
  }

  const subscriptions: string[] = []
  data.data.items.forEach((item) => {
    if (typeof item === 'object') {
      subscriptions.push(getSubscriptionKey(item))
    }
  })
  logger.info(`Currently subscribed to: ${subscriptions}`)

  return new Set(subscriptions)
}
