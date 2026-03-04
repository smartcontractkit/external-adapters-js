import { makeLogger } from '@chainlink/external-adapter-framework/util'

const logger = makeLogger('NcfxTransport')

/**
 * Common WebSocket message types for NCFX feeds
 */
export type WsInfoMessage = {
  Type: string
  Message: string
}

export type WsPriceMessage = {
  timestamp: string // e.g. "2023-01-31T20:10:41" or "2026-01-15 17:09:38.501"
  currencyPair: string // e.g. "ETH/USD" or "ARS-USD"
  bid?: number
  offer?: number // Used by crypto feeds
  ask?: number // Used by forex-continuous feed
  mid?: number
}

export type WsMessage = WsInfoMessage | WsPriceMessage

/**
 * Type guard to check if a message is an info message
 */
export const isInfoMessage = (message: WsMessage): message is WsInfoMessage => {
  return (message as WsInfoMessage).Type !== undefined
}

/**
 * Parses the provider timestamp and ensures it has timezone info
 * NCFX timestamps are UTC but often missing the 'Z' suffix
 */
export const parseProviderTime = (timestamp: string): number => {
  const providerTime = timestamp.includes('Z') ? timestamp : `${timestamp}Z`
  return new Date(providerTime).getTime()
}

/**
 * Handles info messages with appropriate logging
 * Returns true if message was an info message (caller should return early)
 */
export const handleInfoMessage = (message: WsMessage): boolean => {
  if (!isInfoMessage(message)) {
    return false
  }

  logger.debug(`Received message ${message.Type}: ${message.Message}`)

  if (
    message.Message === "Request contains pairs you don't have access to, please check the request"
  ) {
    logger.error(`Request contains pairs you don't have access to`)
    logger.error(`Possible Solutions:
      1. Confirm you are using the same symbol found in the job spec with the correct case.
      2. There maybe an issue with the job spec or the Data Provider may have delisted the asset. Reach out to Chainlink Labs.`)
  }

  return true
}

/**
 * Context type for the open handler - matches what the framework provides
 */
type OpenHandlerContext = {
  adapterSettings: {
    API_USERNAME?: string
    API_PASSWORD?: string
  }
}

/**
 * Creates the WebSocket open handler for NCFX authentication
 * This is shared across all NCFX WebSocket transports
 */
export const wsOpenHandler = (
  connection: WebSocket,
  context: OpenHandlerContext,
): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    // Set up listener for auth response
    connection.addEventListener('message', (event: MessageEvent) => {
      const parsed = JSON.parse(event.data.toString())
      if (parsed.Message === 'Successfully Authenticated') {
        logger.debug('Got logged in response, connection is ready')
        resolve()
      } else {
        reject(new Error(`Unexpected message after WS connection open: ${event.data.toString()}`))
      }
    })

    // Send login payload
    logger.debug('Logging in WS connection')
    connection.send(
      JSON.stringify({
        request: 'login',
        username: context.adapterSettings.API_USERNAME,
        password: context.adapterSettings.API_PASSWORD,
      }),
    )
  }).catch((error) => {
    if (
      error.message ===
      'Unexpected message after WS connection open: {"Type":"Error","Message":"Login failed, Invalid login"}'
    ) {
      logger.error(`Login failed, Invalid login`)
      logger.error(`Possible Solutions:
        1. Doublecheck your supplied credentials.
        2. Contact Data Provider to ensure your subscription is active
        3. If credentials are supplied under the node licensing agreement with Chainlink Labs, please make contact with us and we will look into it.`)
    }
    throw error
  })
}

/**
 * Creates subscription message builders for a given pair separator
 */
export const createSubscriptionBuilders = (pairSeparator: string) => ({
  subscribeMessage: (params: { base: string; quote: string }) => ({
    request: 'subscribe',
    ccy: `${params.base}${pairSeparator}${params.quote}`,
  }),
  unsubscribeMessage: (params: { base: string; quote: string }) => ({
    request: 'unsubscribe',
    ccy: `${params.base}${pairSeparator}${params.quote}`,
  }),
})
