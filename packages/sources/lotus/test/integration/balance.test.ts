import { AdapterRequest } from '@chainlink/ea-bootstrap'
import process from 'process'
import { server as startServer } from '../../src'
import { mockLotusResponseSuccess } from './fixtures'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'
import type { SuiteContext } from '@chainlink/ea-test-helpers'
import { SuperTest, Test } from 'supertest'

describe('execute', () => {
  const id = '1'
  const context: SuiteContext = {
    req: null,
    server: startServer,
  }

  const envVariables = {
    CACHE_ENABLED: 'false',
    RPC_URL: process.env.RPC_URL || 'http://127.0.0.1:1234/rpc/v0',
    API_KEY: process.env.API_KEY || 'test_api_key',
    API_VERBOSE: 'true',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('with one address', () => {
    const data: AdapterRequest = {
      id,
      data: {
        addresses: [{ address: 'f2eaaj6w4evrdscw4s4o5c3df7ph725tbs3yvg6gi' }],
      },
    }

    it('should return success', async () => {
      mockLotusResponseSuccess()

      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('with multiple addresses', () => {
    const data: AdapterRequest = {
      id,
      data: {
        addresses: [
          { address: 'f2eaaj6w4evrdscw4s4o5c3df7ph725tbs3yvg6gi' },
          { address: 'f225ey7bq53ur6sgrkxgf74hl2ftxkajupatwnmay' },
        ],
      },
    }

    it('should return success', async () => {
      mockLotusResponseSuccess()

      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('result is an alias for addresses', () => {
    const data: AdapterRequest = {
      id,
      data: {
        result: [
          { address: 'f2eaaj6w4evrdscw4s4o5c3df7ph725tbs3yvg6gi' },
          { address: 'f225ey7bq53ur6sgrkxgf74hl2ftxkajupatwnmay' },
        ],
      },
    }

    it('should return success', async () => {
      mockLotusResponseSuccess()

      const response = await (context.req as SuperTest<Test>)
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
