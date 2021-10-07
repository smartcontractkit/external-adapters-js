import { server as startServer } from '../../src/index'
import { ethers, BigNumber } from 'ethers'
import request from 'supertest'

const mockBigNum = BigNumber.from('464590202399031116379217447')

jest.mock('ethers', () => ({
  ...jest.requireActual('ethers'),
  ethers: {
    providers: {
      JsonRpcProvider: function (_: string): ethers.provider.JsonRpcProvider {
        return {}
      },
    },
    Contract: function () {
      return {
        currentDebt: () => {
          return [mockBigNum, true]
        },
      }
    },
  },
}))

let oldEnv: NodeJS.ProcessEnv

describe('synthetix-debt-pool', () => {
  let server: http.Server
  const req = request('localhost:8080')

  beforeAll(async () => {
    server = await startServer()
    process.env.RPC_URL = 'FAKE_RPC_URL'
    process.env.CACHE_ENABLED = 'false'
  })
  afterAll((done) => {
    process.env = oldEnv
    server.close(done)
  })

  describe('when making a request to fetch the current debt', () => {
    const request = {
      id: 1,
      data: {},
    }
    it('successfully fetches the current debt size of the synthetix debt pool', async () => {
      const response = await req
        .post('/')
        .send(request)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)

      expect(response.body).toMatchSnapshot()
    })
  })
})
