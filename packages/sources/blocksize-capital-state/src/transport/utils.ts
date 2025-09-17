import type { WebSocket } from '@chainlink/external-adapter-framework/transports/websocket'
import { makeLogger } from '@chainlink/external-adapter-framework/util'

const logger = makeLogger('BlocksizeStateUtils')

type AuthParams = {
  api_key: string
  token: string
}

type TickerParams = {
  tickers: string[]
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

export const buildBlocksizeWebsocketAuthMessage = (auth: AuthParams) => ({
  jsonrpc: '2.0',
  method: 'authentication_logon',
  params: auth,
})

export const buildBlocksizeWebsocketTickersMessage = (
  method: string,
  tickerParams: TickerParams,
) => ({
  jsonrpc: '2.0',
  method,
  params: tickerParams,
})

export const processStateData = (state: StateData, isStreaming: boolean = false) => {
  const ticker = `${state.base_symbol}/${state.quote_symbol}`

  // Validate
  if (!state.aggregated_state_price || !state.base_symbol || !state.quote_symbol) {
    const errorMessage = `The data provider data is incomplete for ${ticker} - missing required fields`
    logger.info(errorMessage)
    return {
      params: { base: state.base_symbol, quote: state.quote_symbol },
      response: { statusCode: 502, errorMessage },
    }
  }
  const state_price = parseFloat(state.aggregated_state_price)
  if (isNaN(state_price) || state_price <= 0) {
    const errorMessage = `The data provider returned invalid aggregated_state_price for ${ticker}: ${state.aggregated_state_price}`
    logger.info(errorMessage)
    return {
      params: { base: state.base_symbol, quote: state.quote_symbol },
      response: { statusCode: 502, errorMessage },
    }
  }

  // streaming updates for debug purposes
  if (isStreaming) {
    logger.debug(
      `Update: ${ticker} = ${state_price} @ ${new Date(state.timestamp * 1000).toISOString()}`,
    )
  }

  return {
    params: { base: state.base_symbol, quote: state.quote_symbol },
    response: {
      data: { result: state_price },
      result: state_price,
      timestamps: { providerIndicatedTimeUnixMs: state.timestamp * 1000 },
    },
  }
}

// use as open handler for standard WS connections
export const blocksizeStateWebsocketOpenHandler = (
  connection: WebSocket,
  auth: AuthParams,
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

    const message = buildBlocksizeWebsocketAuthMessage(auth)
    logger.debug('Sending authentication message...')
    connection.send(JSON.stringify(message))
  })
}
