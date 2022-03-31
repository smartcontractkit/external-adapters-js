import { AdapterRequest } from '@chainlink/types'
import { util } from '@chainlink/ea-bootstrap'
import { server as startServer } from '../../src'
import nock from 'nock'
import http from 'http'
import request, { SuperTest, Test } from 'supertest'
import { mockSuccessfulResponseCoingecko, mockSuccessfulResponseCoinpaprika } from './fixtures'
import { AddressInfo } from 'net'

let oldEnv: NodeJS.ProcessEnv

const setupEnvironment = (adapters: string[]) => {
  for (const a of adapters) {
    process.env[`${a.toUpperCase()}_${util.ENV_ADAPTER_URL}`] = `https://external.adapter.com/${a}`
  }
}

describe('impliedPrice', () => {
  let server: http.Server
  let req: SuperTest<Test>

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    server = await startServer()
    req = request(`localhost:${(server.address() as AddressInfo).port}`)
    setupEnvironment(['coingecko', 'coinpaprika', 'failing'])
    if (process.env.RECORD) {
      nock.recorder.rec()
    }
  })

  afterAll((done) => {
    if (process.env.RECORD) {
      nock.recorder.play()
    }
    process.env = oldEnv
    nock.restore()
    nock.cleanAll()
    nock.enableNetConnect()
    server.close(done)
  })

  describe('successful calls', () => {
    const jobID = '1'

    it('return success without comma separated sources', async () => {
      mockSuccessfulResponseCoingecko()
      mockSuccessfulResponseCoinpaprika()
      const data: AdapterRequest = {
        id: jobID,
        data: {
          dividendSources: ['coingecko', 'coinpaprika'],
          divisorSources: ['coingecko', 'coinpaprika'],
          dividendInput: {
            from: 'LINK',
            to: 'USD',
          },
          divisorInput: {
            from: 'ETH',
            to: 'USD',
          },
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

    it('returns success with comma separated sources', async () => {
      mockSuccessfulResponseCoingecko()
      mockSuccessfulResponseCoinpaprika()
      const data: AdapterRequest = {
        id: jobID,
        data: {
          dividendSources: 'coingecko,coinpaprika',
          divisorSources: 'coingecko,coinpaprika',
          dividendInput: {
            from: 'LINK',
            to: 'USD',
          },
          divisorInput: {
            from: 'ETH',
            to: 'USD',
          },
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

  describe('erroring calls', () => {
    const jobID = '1'

    it('returns error if not reaching minAnswers', async () => {
      mockSuccessfulResponseCoingecko()
      const data: AdapterRequest = {
        id: jobID,
        data: {
          dividendSources: ['coingecko'],
          dividendMinAnswers: 2,
          divisorSources: ['coingecko'],
          dividendInput: {
            from: 'LINK',
            to: 'USD',
          },
          divisorInput: {
            from: 'ETH',
            to: 'USD',
          },
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

  describe('validation error', () => {
    const jobID = '1'

    it('returns a validation error if the request data is empty', async () => {
      const data: AdapterRequest = { id: jobID, data: {} }

      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400)
      expect(response.body).toMatchSnapshot()
    })

    it('returns a validation error if the request contains unsupported sources', async () => {
      const data: AdapterRequest = {
        id: jobID,
        data: {
          dividendSources: ['NOT_REAL'],
          divisorSources: ['coingecko'],
          dividendInput: {
            from: 'LINK',
            to: 'USD',
          },
          divisorInput: {
            from: 'ETH',
            to: 'USD',
          },
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
