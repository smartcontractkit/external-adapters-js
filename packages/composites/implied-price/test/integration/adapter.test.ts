import type { AdapterRequest } from '@chainlink/ea-bootstrap'
import { util } from '@chainlink/ea-bootstrap'
import { server as startServer } from '../../src'
import { mockSuccessfulResponseCoingecko, mockSuccessfulResponseCoinpaprika } from './fixtures'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'
import type { SuiteContext } from '@chainlink/ea-test-helpers'
import { SuperTest, Test } from 'supertest'

const setupEnvironment = (adapters: string[]) => {
  const env = {} as { [key: string]: string }
  for (const a of adapters) {
    env[`${a.toUpperCase()}_${util.ENV_ADAPTER_URL}`] = `https://external.adapter.com/${a}`
  }
  return env
}

describe('impliedPrice', () => {
  const context: SuiteContext = {
    req: null,
    server: startServer,
  }
  const envVariables = setupEnvironment(['coingecko', 'coinpaprika', 'failing'])
  setupExternalAdapterTest(envVariables, context)
  describe('with endpoint computedPrice', () => {
    const endpoint = 'computedPrice'

    describe('successful calls', () => {
      const jobID = '1'

      it('return success without comma separated sources', async () => {
        mockSuccessfulResponseCoingecko()
        mockSuccessfulResponseCoinpaprika()
        const data: AdapterRequest = {
          id: jobID,
          data: {
            endpoint,
            operand1Sources: ['coingecko', 'coinpaprika'],
            operand2Sources: ['coingecko', 'coinpaprika'],
            operand1Input: {
              from: 'LINK',
              to: 'USD',
            },
            operand2Input: {
              from: 'ETH',
              to: 'USD',
            },
            operation: 'divide',
          },
        }

        const response = await (context.req as SuperTest<Test>)
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
            endpoint,
            operand1Sources: 'coingecko,coinpaprika',
            operand2Sources: 'coingecko,coinpaprika',
            operand1Input: {
              from: 'LINK',
              to: 'USD',
            },
            operand2Input: {
              from: 'ETH',
              to: 'USD',
            },
            operation: 'divide',
          },
        }

        const response = await (context.req as SuperTest<Test>)
          .post('/')
          .send(data)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
        expect(response.body).toMatchSnapshot()
      })

      it('can multiply operands', async () => {
        mockSuccessfulResponseCoingecko()
        mockSuccessfulResponseCoinpaprika()
        const data: AdapterRequest = {
          id: jobID,
          data: {
            endpoint,
            operand1Sources: ['coingecko', 'coinpaprika'],
            operand2Sources: ['coingecko', 'coinpaprika'],
            operand1Input: {
              from: 'LINK',
              to: 'USD',
            },
            operand2Input: {
              from: 'ETH',
              to: 'USD',
            },
            operation: 'multiply',
          },
        }

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

    describe('erroring calls', () => {
      const jobID = '1'

      it('returns error if not reaching minAnswers', async () => {
        mockSuccessfulResponseCoingecko()
        const data: AdapterRequest = {
          id: jobID,
          data: {
            endpoint,
            operand1Sources: ['coingecko'],
            operand1MinAnswers: 2,
            operand2Sources: ['coingecko'],
            operand1Input: {
              from: 'LINK',
              to: 'USD',
            },
            operand2Input: {
              from: 'ETH',
              to: 'USD',
            },
            operation: 'divide',
          },
        }
        const response = await (context.req as SuperTest<Test>)
          .post('/')
          .send(data)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(500)
        expect(response.body).toMatchSnapshot()
      })

      it('returns error if operand1 has zero price', async () => {
        mockSuccessfulResponseCoingecko()
        mockSuccessfulResponseCoinpaprika()
        const data: AdapterRequest = {
          id: jobID,
          data: {
            endpoint,
            operand1Sources: ['coingecko', 'coinpaprika'],
            operand2Sources: ['coingecko', 'coinpaprika'],
            operand1Input: {
              from: 'DEAD',
              to: 'USD',
            },
            operand2Input: {
              from: 'ETH',
              to: 'USD',
            },
            operation: 'divide',
          },
        }
        const response = await (context.req as SuperTest<Test>)
          .post('/')
          .send(data)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(500)
        expect(response.body).toMatchSnapshot()
      })

      it('returns error if operand2 has zero price', async () => {
        mockSuccessfulResponseCoingecko()
        mockSuccessfulResponseCoinpaprika()
        const data: AdapterRequest = {
          id: jobID,
          data: {
            endpoint,
            operand1Sources: ['coingecko', 'coinpaprika'],
            operand2Sources: ['coingecko', 'coinpaprika'],
            operand1Input: {
              from: 'LINK',
              to: 'USD',
            },
            operand2Input: {
              from: 'DEAD',
              to: 'USD',
            },
            operation: 'divide',
          },
        }
        const response = await (context.req as SuperTest<Test>)
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
        const data: AdapterRequest = { id: jobID, data: { endpoint } }

        const response = await (context.req as SuperTest<Test>)
          .post('/')
          .send(data)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(400)
        expect(response.body).toMatchSnapshot()
      })

      it('returns a validation error if the request is missing operand1 input', async () => {
        const data: AdapterRequest = {
          id: jobID,
          data: {
            endpoint,
            operand1Sources: ['coingecko'],
            operand2Sources: ['coingecko'],
            operand2Input: {
              from: 'ETH',
              to: 'USD',
            },
            operation: 'divide',
          },
        }

        const response = await (context.req as SuperTest<Test>)
          .post('/')
          .send(data)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(400)
        expect(response.body).toMatchSnapshot()
      })

      it('returns a validation error if the request is missing operand2 input', async () => {
        const data: AdapterRequest = {
          id: jobID,
          data: {
            endpoint,
            operand1Sources: ['coingecko'],
            operand2Sources: ['coingecko'],
            operand1Input: {
              from: 'LINK',
              to: 'USD',
            },
            operation: 'divide',
          },
        }

        const response = await (context.req as SuperTest<Test>)
          .post('/')
          .send(data)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(400)
        expect(response.body).toMatchSnapshot()
      })

      it('returns a validation error if the request is missing operation', async () => {
        const data: AdapterRequest = {
          id: jobID,
          data: {
            endpoint,
            operand1Sources: ['coingecko'],
            operand2Sources: ['coingecko'],
            operand1Input: {
              from: 'LINK',
              to: 'USD',
            },
            operand2Input: {
              from: 'ETH',
              to: 'USD',
            },
          },
        }

        const response = await (context.req as SuperTest<Test>)
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
            endpoint,
            operand1Sources: ['NOT_REAL'],
            operand2Sources: ['coingecko'],
            operand1Input: {
              from: 'LINK',
              to: 'USD',
            },
            operand2Input: {
              from: 'ETH',
              to: 'USD',
            },
            operation: 'divide',
          },
        }

        const response = await (context.req as SuperTest<Test>)
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

  describe('with endpoint impliedPrice', () => {
    const endpoint = 'impliedPrice'

    describe('successful calls', () => {
      const jobID = '1'

      it('return success without comma separated sources', async () => {
        mockSuccessfulResponseCoingecko()
        mockSuccessfulResponseCoinpaprika()
        const data: AdapterRequest = {
          id: jobID,
          data: {
            endpoint,
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

        const response = await (context.req as SuperTest<Test>)
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
            endpoint,
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

    describe('erroring calls', () => {
      const jobID = '1'

      it('returns error if not reaching minAnswers', async () => {
        mockSuccessfulResponseCoingecko()
        const data: AdapterRequest = {
          id: jobID,
          data: {
            endpoint,
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
        const response = await (context.req as SuperTest<Test>)
          .post('/')
          .send(data)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(500)
        expect(response.body).toMatchSnapshot()
      })

      it('returns error if dividend has zero price', async () => {
        mockSuccessfulResponseCoingecko()
        mockSuccessfulResponseCoinpaprika()
        const data: AdapterRequest = {
          id: jobID,
          data: {
            endpoint,
            dividendSources: ['coingecko', 'coinpaprika'],
            divisorSources: ['coingecko', 'coinpaprika'],
            dividendInput: {
              from: 'DEAD',
              to: 'USD',
            },
            divisorInput: {
              from: 'ETH',
              to: 'USD',
            },
          },
        }
        const response = await (context.req as SuperTest<Test>)
          .post('/')
          .send(data)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(500)
        expect(response.body).toMatchSnapshot()
      })

      it('returns error if divisor has zero price', async () => {
        mockSuccessfulResponseCoingecko()
        mockSuccessfulResponseCoinpaprika()
        const data: AdapterRequest = {
          id: jobID,
          data: {
            endpoint,
            dividendSources: ['coingecko', 'coinpaprika'],
            divisorSources: ['coingecko', 'coinpaprika'],
            dividendInput: {
              from: 'LINK',
              to: 'USD',
            },
            divisorInput: {
              from: 'DEAD',
              to: 'USD',
            },
          },
        }
        const response = await (context.req as SuperTest<Test>)
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

        const response = await (context.req as SuperTest<Test>)
          .post('/')
          .send(data)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(400)
        expect(response.body).toMatchSnapshot()
      })

      it('returns a validation error if the request is missing dividend input', async () => {
        const data: AdapterRequest = {
          id: jobID,
          data: {
            endpoint,
            dividendSources: ['coingecko'],
            divisorSources: ['coingecko'],
            divisorInput: {
              from: 'ETH',
              to: 'USD',
            },
          },
        }

        const response = await (context.req as SuperTest<Test>)
          .post('/')
          .send(data)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(400)
        expect(response.body).toMatchSnapshot()
      })

      it('returns a validation error if the request is missing divisor input', async () => {
        const data: AdapterRequest = {
          id: jobID,
          data: {
            endpoint,
            dividendSources: ['coingecko'],
            divisorSources: ['coingecko'],
            dividendInput: {
              from: 'LINK',
              to: 'USD',
            },
          },
        }

        const response = await (context.req as SuperTest<Test>)
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
            endpoint,
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

        const response = await (context.req as SuperTest<Test>)
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
})
