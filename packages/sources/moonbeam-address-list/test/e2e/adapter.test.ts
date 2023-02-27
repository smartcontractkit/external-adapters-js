import request, { SuperTest, Test } from 'supertest'
import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { AddressInfo } from 'net'
import { adapter } from '../../src/index'

describe('execute', () => {
  let fastify: ServerInstance | undefined
  let req: SuperTest<Test>

  afterAll((done) => {
    fastify?.close(done())
  })

  it('addresses should return success', async () => {
    const data = {
      data: {
        contractAddress: '0xFA36Fe1dA08C89eC72Ea1F0143a35bFd5DAea108',
        network: 'moonbeam',
        chainId: 'mainnet',
      },
    }
    fastify = await expose(adapter)
    req = request(`http://localhost:${(fastify?.server.address() as AddressInfo).port}`)

    const response = await req
      .post('/')
      .send(data)
      .set('Accept', '*/*')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
    expect(response.statusCode).toEqual(200)
  })
})
