import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { server as startServer } from '../../src'
import { mockCryptoResponseSuccess, mockPROCryptoResponseSuccess } from './fixtures'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'

describe('execute', () => {
  const id = '1'
  const context = {
    req: null,
    server: startServer,
  }

  const envVariables = {
    CACHE_ENABLED: 'false',
  }

  const testOptions = {
    cleanNock: false,
  }

  setupExternalAdapterTest(envVariables, context, testOptions)

  describe('crypto-single api', () => {
    describe('Successful request without override', () => {
      mockCryptoResponseSuccess()
      it('Should be successful', async () => {
        const data = {
          id: '1',
          data: {
            endpoint: 'crypto-single',
            to: 'USD',
            from: 'ETH',
          },
        }
        const response = await context.req
          .post('/')
          .send(data)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
        expect(response.body.result).toMatchSnapshot()
      })
    })

    describe('Successful request with override', () => {
      mockCryptoResponseSuccess()
      it('Should be successful', async () => {
        const data = {
          id: '1',
          data: {
            endpoint: 'crypto-single',
            to: 'USD',
            from: 'AMPL',
            overrides: {
              coinpaprika: {
                AMPL: 'eth-ethereum',
              },
            },
          },
        }
        const response = await context.req
          .post('/')
          .send(data)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
        expect(response.body.result).toMatchSnapshot()
      })
    })

    describe('Successful request with warning about duplicate ticker symbol', () => {
      mockCryptoResponseSuccess()
      it('Should be successful', async () => {
        const data = {
          id: '1',
          data: {
            endpoint: 'crypto-single',
            to: 'USD',
            from: 'BTC',
          },
        }
        const response = await context.req
          .post('/')
          .send(data)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
        expect(response.body.result).toMatchSnapshot()
      })
    })
  })

  describe('crypto api free', () => {
    it('should return success for single symbol', async () => {
      mockCryptoResponseSuccess()
      const data: AdapterRequest = {
        id,
        data: {
          base: 'ETH',
          quote: 'USD',
        },
      }
      const response = await context.req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })

    it('should return success for multiple symbols', async () => {
      mockCryptoResponseSuccess()

      const data: AdapterRequest = {
        id,
        data: {
          base: ['ETH', 'BTC'],
          quote: 'USD',
        },
      }
      const response = await context.req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })

    it('should apply overrides', async () => {
      mockCryptoResponseSuccess()

      const data: AdapterRequest = {
        id,
        data: {
          base: ['ETH', 'BTC'],
          quote: 'USD',
          overrides: {
            coinpaprika: {
              BTC: 'btc-bitcoin',
            },
          },
        },
      }

      const response = await context.req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })

    it('should return success for single coinid', async () => {
      mockCryptoResponseSuccess()
      const data: AdapterRequest = {
        id,
        data: {
          base: 'AAAA',
          quote: 'USD',
          coinid: 'eth-ethereum',
        },
      }
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

  describe('volume api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'volume',
        base: 'ETH',
        quote: 'USD',
      },
    }

    it('should return success', async () => {
      mockCryptoResponseSuccess()

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

  describe('dominance api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'dominance',
        market: 'BTC',
      },
    }

    it('should return success', async () => {
      mockCryptoResponseSuccess()

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

  describe('globalmarketcap api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'globalmarketcap',
        market: 'USD',
      },
    }

    it('should return success', async () => {
      mockCryptoResponseSuccess()

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

  describe('marketcap api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'marketcap',
        base: 'ETH',
        quote: 'USD',
      },
    }

    it('should return success', async () => {
      mockCryptoResponseSuccess()

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

  describe('vwap api', () => {
    it('should return success', async () => {
      mockCryptoResponseSuccess()
      const vwapData: AdapterRequest = {
        id,
        data: {
          base: 'ETH',
          endpoint: 'vwap',
        },
      }

      const response = await context.req
        .post('/')
        .send(vwapData)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })

    it('should return success with override', async () => {
      mockCryptoResponseSuccess()
      const dataWithOverride: AdapterRequest = {
        id,
        data: {
          base: 'AAAA',
          overrides: {
            coinpaprika: {
              AAAA: 'ampl-ampleforth',
            },
          },
          endpoint: 'vwap',
        },
      }

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
})

describe('execute with api key', () => {
  const context = {
    req: null,
    server: startServer,
  }

  const envVariables = {
    API_KEY: 'fake-api-key',
    CACHE_ENABLED: 'false',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('crypto api pro', () => {
    const data: AdapterRequest = {
      id: '1',
      data: {
        base: 'ETH',
        quote: 'USD',
      },
    }

    it('should return success', async () => {
      mockPROCryptoResponseSuccess()

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
