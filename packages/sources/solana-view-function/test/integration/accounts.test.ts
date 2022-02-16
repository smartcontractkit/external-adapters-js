import { AdapterRequest } from '@chainlink/types'
import { server as startServer } from '../../src'
import '@solana/web3.js'
import { mockAccountsInfo } from './fixtures'
import http from 'http'
import request, { SuperTest, Test } from 'supertest'
import { AddressInfo } from 'net'

jest.mock('@solana/web3.js', () => ({
  ...jest.requireActual('@solana/web3.js'),
  Connection: class {
    getMultipleAccountsInfo() {
      return mockAccountsInfo
    }
  },
}))

let oldEnv: NodeJS.ProcessEnv

describe('accounts', () => {
  let server: http.Server
  let req: SuperTest<Test>

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    server = await startServer()
    req = request(`localhost:${(server.address() as AddressInfo).port}`)
    process.env.RPC_URL = 'https://api.devnet.solana.com'
  })

  afterAll((done) => {
    process.env = oldEnv
    server.close(done)
  })

  describe('successful calls', () => {
    const jobID = '1'

    it('returns success when fetching the account information', async () => {
      const data: AdapterRequest = {
        id: jobID,
        data: {
          addresses: [
            'EMtjYGwPnXdtqK5SGL8CWGv4wgdBQN79UPoy53x9bBTJ',
            'BSGfVnE6q6KemspkugEERU8x7WbQwSKwvHT1cZZ4ACVN',
            '3FMBoeddUhtqxepzkrxPrMUV3CL4bZM5QmMoLJfEpirz',
          ],
        },
      }
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

  describe('errored calls', () => {
    const jobID = '1'

    it('returns an error when there are no addresses passed to the EA', async () => {
      const data: AdapterRequest = {
        id: jobID,
        data: {
          addresses: [],
        },
      }
      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400)
      expect(response.body).toMatchSnapshot()
    })

    it('returns an error when there is no rpc url is set', async () => {
      delete process.env.RPC_URL
      const data: AdapterRequest = {
        id: jobID,
        data: {
          addresses: ['EMtjYGwPnXdtqK5SGL8CWGv4wgdBQN79UPoy53x9bBTJ'],
        },
      }
      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(500)
      expect(response.body).toMatchSnapshot()
    })
  })
})
