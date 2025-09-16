import { createLogger } from './Logger'

const logger = createLogger('BlocksizeStateUtils')

export type ProviderParams = {
  tickers?: string[]
  api_key?: string
  token?: string
}

const buildBlocksizeWebsocketMessage = (method: string, params: ProviderParams): unknown => {
  return {
    jsonrpc: '2.0',
    method: method,
    params: params,
  }
}

export const buildBlocksizeWebsocketAuthMessage = (apiKey: string, token: string) =>
  buildBlocksizeWebsocketMessage('authentication_logon', { api_key: apiKey, token: token })

export const buildBlocksizeWebsocketTickersMessage = (method: string, pair: string) =>
  buildBlocksizeWebsocketMessage(method, { tickers: [pair] })

export const blocksizeDefaultUnsubscribeMessageBuilder = (
  base: string,
  quote: string,
  method: string,
): unknown => {
  const pair = `${base}${quote}`.toUpperCase()
  return buildBlocksizeWebsocketTickersMessage(method, pair)
}

export interface StateData {
  timestamp: number
  base_symbol: string
  quote_symbol: string
  aggregated_state_price: string
  aggregated_plus_1_percent_usd_market_depth: string
  aggregated_minus_1_percent_usd_market_depth: string
  aggregated_7d_usd_trading_volume: string
}

export const validateStateData = (state: StateData, ticker: string): string | null => {
  // Check for required fields
  if (!state.aggregated_state_price || !state.base_symbol || !state.quote_symbol) {
    return `The data provider data is incomplete for ${ticker} - missing required fields`
  }
  // Validate state price
  const price = parseFloat(state.aggregated_state_price)
  if (isNaN(price) || price <= 0) {
    return `The data provider returned invalid aggregated_state_price for ${ticker}: ${state.aggregated_state_price}`
  }
  return null
}

export const buildErrorResponse = (state: StateData, errorMessage: string) => ({
  params: { base: state.base_symbol, quote: state.quote_symbol },
  response: {
    statusCode: 502,
    errorMessage,
  },
})

export const buildSuccessResponse = (state: StateData, state_price: number) => ({
  params: { base: state.base_symbol, quote: state.quote_symbol },
  response: {
    data: { result: state_price },
    result: state_price,
    timestamps: { providerIndicatedTimeUnixMs: state.timestamp * 1000 },
  },
})

export const processStateData = (state: StateData, isStreaming: boolean = false) => {
  const ticker = `${state.base_symbol}/${state.quote_symbol}`

  // Validate data
  const validationError = validateStateData(state, ticker)
  if (validationError) {
    logger.info(validationError)
    return buildErrorResponse(state, validationError)
  }

  const state_price = parseFloat(state.aggregated_state_price)

  // Log streaming updates
  if (isStreaming) {
    logger.info(
      `Update: ${ticker} = ${state_price} @ ${new Date(state.timestamp * 1000).toISOString()}`,
    )
  }

  return buildSuccessResponse(state, state_price)
}

// use as open handler for standard WS connections
export const blocksizeStateWebsocketOpenHandler = (
  connection: WebSocket,
  apiKey: string,
  token: string,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Authentication timeout after 10 seconds'))
    }, 10000)

    const messageHandler = (event: MessageEvent) => {
      try {
        const parsed = JSON.parse(event.data.toString())
        if (parsed.result?.user_id && !parsed.error) {
          logger.debug('Got logged in response, connection is ready')
          clearTimeout(timeoutId)
          connection.removeEventListener('message', messageHandler)
          resolve()
          return
        }

        if (parsed.error) {
          clearTimeout(timeoutId)
          connection.removeEventListener('message', messageHandler)

          if (parsed.error.code === 4001) {
            // Invalid API key
            logger.warn(`Authentication failed - Invalid API key. Possible Solutions:
              1. Doublecheck your API_KEY environment variable
              2. Contact Blocksize Capital to ensure your subscription is active
              3. Verify your API key hasn't expired`)
          } else if (parsed.error.code === 4002) {
            // Invalid API token
            logger.warn(`Authentication failed - Invalid API token. Possible Solutions:
              1. Doublecheck your TOKEN environment variable
              2. Contact Blocksize Capital to ensure your credentials are correct
              3. Try regenerating your API token`)
          } else if (parsed.error.code === 4003) {
            // Payment required
            logger.warn(`Subscription required. Possible Solutions:
              1. Ensure your Blocksize Capital subscription is active
              2. Contact Blocksize Capital billing support
              3. Verify your payment method is up to date`)
          } else {
            logger.warn(`Authentication error: ${parsed.error.message}`)
          }

          reject(new Error(`Failed to make WS connection: ${JSON.stringify(parsed)}`))
        }
      } catch (error) {
        clearTimeout(timeoutId)
        connection.removeEventListener('message', messageHandler)
        const errorMessage = error instanceof Error ? error.message : String(error)
        reject(new Error(`Failed to parse authentication response: ${errorMessage}`))
      }
    }

    connection.addEventListener('message', messageHandler)

    const message = buildBlocksizeWebsocketAuthMessage(apiKey, token)
    logger.debug('Sending authentication message...')
    connection.send(JSON.stringify(message))
  })
}
