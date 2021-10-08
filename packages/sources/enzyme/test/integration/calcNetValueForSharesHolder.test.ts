import { AdapterRequest } from '@chainlink/types'
import request from 'supertest'
import nock from 'nock'
import http from 'http'
import { server as startServer } from '../../src'
import { mockEthereumResponseSuccess } from './fixtures'
import { ENV_RPC_URL } from '../../src/config'

let oldEnv: NodeJS.ProcessEnv

beforeAll(() => {
  oldEnv = JSON.parse(JSON.stringify(process.env))
  process.env.CACHE_ENABLED = 'false'
  process.env[ENV_RPC_URL] = process.env[ENV_RPC_URL] || 'http://localhost:8545/'
  process.env.API_VERBOSE = 'true'
  if (process.env.RECORD) {
    nock.recorder.rec()
  }
})

afterAll(() => {
  process.env = oldEnv
  if (process.env.RECORD) {
    nock.recorder.play()
  }

  nock.restore()
  nock.cleanAll()
  nock.enableNetConnect()
})

describe('execute', () => {
  const id = '1'
  let server: http.Server
  const req = request('localhost:8080')
  beforeAll(async () => {
    server = await startServer()
    process.env.CACHE_ENABLED = 'false'
  })
  afterAll((done) => {
    server.close(done)
  })

  describe('with calculatorContract/vaultProxy/sharesHolder', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'calcNetValueForSharesHolder',
        calculatorContract: '0x0b2cBB1974f17700531439E3e4AfF5e5D2AADD4A',
        vaultProxy: '0x399acf6102c466a3e4c5f94cd00fc1bfb071d3c1',
        sharesHolder: '0x31d675bd2bdfdd3e332311bef7cb6ba357a5d4e3',
      },
    }

    it('should return success', async () => {
      mockEthereumResponseSuccess()

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
})
