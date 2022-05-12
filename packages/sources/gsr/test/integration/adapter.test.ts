import { AdapterRequest } from '@chainlink/types'
import { AddressInfo } from 'net'
import request, { SuperTest, Test } from 'supertest'
import { server as startServer } from '../../src'
import { mockSubscribeResponse, mockTokenResponse, mockUnsubscribeResponse } from './fixtures'
import {
  mockWebSocketFlow,
  mockWebSocketProvider,
  mockWebSocketServer,
  MockWsServer,
} from '@chainlink/ea-test-helpers'
import { WebSocketClassProvider } from '@chainlink/ea-bootstrap/dist/lib/middleware/ws/recorder'

describe('websocket', () => {
  let mockedWsServer: InstanceType<typeof MockWsServer>
  let fastify: FastifyInstance
  let req: SuperTest<Test>
  let oldEnv: NodeJS.ProcessEnv
  let spy: jest.SpyInstance

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.WS_ENABLED = 'true'

    if (!process.env.RECORD) {
      mockedWsServer = mockWebSocketServer('wss://testwsurl.io')
      mockWebSocketProvider(WebSocketClassProvider)
      process.env.WS_USER_ID = 'test-user-id'
      process.env.WS_PUBLIC_KEY = 'test-pub-key'
      process.env.WS_PRIVATE_KEY = 'test-priv-key'
      process.env.WS_API_ENDPOINT = 'wss://testwsurl.io'
      process.env.API_ENDPOINT = 'https://test-url.com'
      const mockDate = new Date('2022-05-10T16:09:27.193Z')
      spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())
      process.env.WS_SUBSCRIPTION_TTL = '1000'
    } else {
      process.env.WS_SUBSCRIPTION_TTL = '3000'
    }

    fastify = await startServer()
    req = request(`localhost:${(fastify.server.address() as AddressInfo).port}`)
  })

  afterAll((done) => {
    spy.mockRestore()
    process.env = oldEnv
    fastify.close(done)
  })

  describe('price endpoint', () => {
    it('should return success', async () => {
      mockTokenResponse()
      const data: AdapterRequest = {
        id: '1',
        data: {
          base: 'ETH',
          quote: 'USDT',
        },
      }

      let flowFulfilled: Promise<boolean>
      if (!process.env.RECORD) {
        flowFulfilled = mockWebSocketFlow(mockedWsServer, [
          mockSubscribeResponse,
          mockUnsubscribeResponse,
        ])
      }

      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)

      spy.mockRestore()
      expect(response.body).toMatchSnapshot()
      await flowFulfilled
    })
  })
})
