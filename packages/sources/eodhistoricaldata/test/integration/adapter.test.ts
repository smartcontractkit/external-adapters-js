import { AdapterRequest } from '@chainlink/ea-bootstrap'
import * as process from 'process'
import { server as startServer } from '../../src'
import { mockOverrideResponseSuccess, mockResponseFail, mockResponseSuccess } from './fixtures'
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
    API_KEY: process.env.API_KEY || 'fake-api-key',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('stock api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        base: 'FTSE',
      },
    }

    it('should return success', async () => {
      mockResponseSuccess()

      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })

    const notFoundData: AdapterRequest = {
      id,
      data: {
        base: 'IBTA',
      },
    }

    it('should fail without overriding', async () => {
      mockResponseFail()

      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(notFoundData)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400)
      expect(response.body).toMatchSnapshot()
    })

    const overrideData: AdapterRequest = {
      id,
      data: {
        base: 'IBTA',
        overrides: {
          eodhistoricaldata: {
            IBTA: 'IBTA.LSE',
          },
        },
      },
    }

    it('should return success with overriding', async () => {
      mockOverrideResponseSuccess()

      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(overrideData)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })
})
