import request, { SuperTest, Test } from 'supertest'
import { createAdapter } from './setup'
import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { AddressInfo } from 'net'

const mockExpectedAddresses = [
  '0x7b67aa8a28a9df5f4a47f364d3d3a4109f009d11d124c5a7babcbf23e653857b',
  '0x30b3e731516319546280d5e77da965ffa33d3aae09b98a4073ffa616c865086f',
  '0xd996fdee462b0e14181c4e12c06639467f74ce6e4a012b4648868fa83cbccd01',
]

jest.mock('ethers', () => {
  const actualModule = jest.requireActual('ethers')
  return {
    ...actualModule,
    ethers: {
      ...actualModule.ethers,
      providers: {
        JsonRpcProvider: function () {
          return {
            getBlockNumber: jest.fn().mockReturnValue(1000),
          }
        },
      },
      Contract: function () {
        return {
          getStashAccounts: jest.fn().mockImplementation(() => mockExpectedAddresses),
        }
      },
    },
  }
})

describe('execute', () => {
  let fastify: ServerInstance | undefined
  let req: SuperTest<Test>
  let spy: jest.SpyInstance

  afterAll((done) => {
    spy.mockRestore()
    fastify?.close(done())
  })

  it('addresses should return success', async () => {
    const data = {
      data: { network: 'moonbeam', chainId: 'mainnet' },
    }
    process.env['RPC_URL'] = 'http://localhost:9091'
    fastify = await expose(createAdapter())
    req = request(`http://localhost:${(fastify?.server.address() as AddressInfo).port}`)
    const mockDate = new Date('2022-08-01T07:14:54.909Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const response = await req
      .post('/')
      .send(data)
      .set('Accept', '*/*')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
    expect(response.body).toMatchSnapshot()
  })
})
