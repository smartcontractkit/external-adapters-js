import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'

export const mockWebsocketServer = (URL: string): MockWebsocketServer => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })

  mockWsServer.on('connection', (socket) => {
    socket.on('message', (message) => {
      let parsed: any
      try {
        parsed = JSON.parse(message.toString())
      } catch {
        return // ignore invalid JSON (e.g. heartbeat, malformed msg)
      }

      if (!parsed || typeof parsed !== 'object' || !parsed.method) {
        return // ignore if method missing
      }

      // mock authentication request
      if (parsed.method === 'authentication_logon') {
        return socket.send(
          JSON.stringify({
            jsonrpc: '2.0',
            id: parsed.id,
            result: { user_id: 'test-user-123' },
          }),
        )
      }

      // mock subscription request
      if (parsed.method === 'state_subscribe') {
        const states =
          parsed.params?.tickers?.map((ticker: string) => {
            const base = ticker.slice(0, -3)
            const quote = ticker.slice(-3)
            return {
              block_time: 1672531200, //1672531200000
              base_symbol: base,
              quote_symbol: quote,
              aggregated_state_price: '1234.56',
              aggregated_plus_1_percent_usd_market_depth: '1000000',
              aggregated_minus_1_percent_usd_market_depth: '1000000',
              aggregated_7d_usd_trading_volume: '5000000',
            }
          }) ?? []

        // Send subscription response with snapshot
        socket.send(
          JSON.stringify({
            jsonrpc: '2.0',
            id: parsed.id,
            result: { snapshot: states },
          }),
        )

        // send a streaming update after subscription
        setTimeout(() => {
          socket.send(
            JSON.stringify({
              jsonrpc: '2.0',
              method: 'state',
              params: { states },
            }),
          )
        }, 100)

        return
      }
    })
  })

  return mockWsServer
}
