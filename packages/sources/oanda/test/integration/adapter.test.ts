// import { ServerInstance } from '@chainlink/external-adapter-framework'
// import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
// import { AddressInfo } from 'net'
// import * as nock from 'nock'
// import request, { SuperTest, Test } from 'supertest'
// import { mockSubscribeError, mockSubscribeResponse, mockUnsubscribeResponse } from './fixtures'
// import { mockWebSocketProvider, mockWebSocketServer } from './setup'

// describe('websocket', () => {
//   let fastify: ServerInstance
//   let req: SuperTest<Test>
//   let oldEnv: NodeJS.ProcessEnv
//   let spy: jest.SpyInstance
//   const apiKey: string = process.env['API_KEY'] ?? 'test-api-key'

//   beforeAll(async () => {
//     oldEnv = JSON.parse(JSON.stringify(process.env))
//     process.env['API_KEY'] = apiKey
//     process.env['WS_SUBSCRIPTION_TTL'] = '3000'
//     process.env['METRICS_ENABLED'] = 'false'
//     process.env['RATE_LIMIT_CAPACITY_SECOND'] = '10'

//     const mockDate = new Date('2022-05-10T16:09:27.193Z')
//     spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

//     if (!process.env['RECORD']) {
//       mockWebSocketServer(`wss://api.chk.elwood.systems/v1/stream?apiKey${process.env['API_KEY']}`)
//       mockWebSocketProvider(WebSocketClassProvider)
//     } else {
//       nock.recorder.rec()
//     }

//     const { server } = await import('../../src')
//     const api = await server()
//     if (!api) {
//       throw 'API did not start'
//     }
//     fastify = api
//     req = request(`localhost:${(fastify.server.address() as AddressInfo).port}`)
//   })

//   afterAll((done) => {
//     spy.mockRestore()
//     process.env = oldEnv
//     fastify.close(done)
//   })

//   describe('price endpoint', () => {
//     it('should return success', async () => {
//       mockSubscribeResponse(apiKey)
//       mockUnsubscribeResponse(apiKey)
//       const data = {
//         id: '1',
//         data: {
//           base: 'ETH',
//           quote: 'USD',
//         },
//       }

//       const response = await req
//         .post('/')
//         .send(data)
//         .set('Accept', '*/*')
//         .set('Content-Type', 'application/json')
//         .expect('Content-Type', /json/)
//         .expect(200)

//       expect(response.body).toMatchSnapshot()
//     }, 10_000)
//     it('should return cached subscribe error', async () => {
//       mockSubscribeError(apiKey)
//       const data = {
//         data: {
//           base: 'XXX',
//           quote: 'USD',
//         },
//       }

//       const response = await req
//         .post('/')
//         .send(data)
//         .set('Accept', '*/*')
//         .set('Content-Type', 'application/json')
//         .expect('Content-Type', /json/)
//         .expect(400)

//       expect(response.body).toMatchSnapshot()
//     }, 10_000)
//   })
// })
