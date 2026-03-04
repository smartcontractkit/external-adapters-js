import { BaseEndpointTypes } from '../../src/endpoint/stock-quotes'
import { buildWsTransport } from '../../src/transport/ws'

describe('DxFeed WebSocket Transport', () => {
  let mockConnection: { send: jest.Mock }
  let transport: ReturnType<typeof buildWsTransport<BaseEndpointTypes>>

  beforeEach(() => {
    mockConnection = { send: jest.fn() }

    transport = buildWsTransport<BaseEndpointTypes>(
      (params) => [{ Quote: [params.base.toUpperCase()] }],
      () => [],
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('heartbeat handler', () => {
    it('should send heartbeat message when called', () => {
      ;(transport as any).connectionClientId = 'test-client-id'
      ;(transport as any).config.handlers.heartbeat(mockConnection)

      expect(mockConnection.send).toHaveBeenCalledWith(
        '[{"id":1,"clientId":"test-client-id","channel":"/meta/connect","connectionType":"websocket"}]',
      )
    })
  })
})
