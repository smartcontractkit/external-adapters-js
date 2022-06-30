import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { server as startServer } from '../../src'
import { mockRateResponseFailure, mockRateResponseSuccess } from './fixtures'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'

describe('execute', () => {
  const id = '1'

  const context = {
    req: null,
    server: startServer,
  }

  const envVariables = {}

  setupExternalAdapterTest(envVariables, context)

  describe('rate api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        base: 'BUSD-BD1',
        quote: 'USDT-6D8',
      },
    }

    it('should return success', async () => {
      mockRateResponseSuccess()

      const response = await context.req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })

    const dataWithOverride: AdapterRequest = {
      id,
      data: {
        base: 'overridablevalue',
        quote: 'USDT-6D8',
        overrides: {
          binance_dex: {
            overridablevalue: 'BUSD-BD1',
          },
        },
      },
    }

    it('should return success for override', async () => {
      mockRateResponseSuccess()

      const response = await context.req
        .post('/')
        .send(dataWithOverride)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('rate api with invalid symbol', () => {
    const data: AdapterRequest = {
      id,
      data: {
        base: 'NON',
        quote: 'EXISTING',
      },
    }

    it('should return failure', async () => {
      mockRateResponseFailure()

      const response = await context.req
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
