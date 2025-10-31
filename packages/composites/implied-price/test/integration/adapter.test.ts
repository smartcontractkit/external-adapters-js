import type { AdapterRequest } from '@chainlink/ea-bootstrap'
import { util } from '@chainlink/ea-bootstrap'
import type { SuiteContext } from '@chainlink/ea-test-helpers'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'
import { SuperTest, Test } from 'supertest'
import { server as startServer } from '../../src'
import {
  mockSuccessfulResponseBigNumberOperand,
  mockSuccessfulResponseCoingecko,
  mockSuccessfulResponseCoinpaprika,
} from './fixtures'

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
  const envVariables = setupEnvironment(['coingecko', 'coinpaprika', 'failing', 'bignumberoperand'])
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

      it('returns success with JSON inputs', async () => {
        mockSuccessfulResponseCoingecko()
        mockSuccessfulResponseCoinpaprika()
        const data: AdapterRequest = {
          id: jobID,
          data: {
            endpoint,
            operand1Sources: 'coingecko,coinpaprika',
            operand2Sources: 'coingecko,coinpaprika',
            operand1Input: JSON.stringify({
              from: 'LINK',
              to: 'USD',
            }),
            operand2Input: JSON.stringify({
              from: 'ETH',
              to: 'USD',
            }),
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

      it('displays number > e+21 as fixed point rather than exponential', async () => {
        mockSuccessfulResponseCoingecko()
        mockSuccessfulResponseCoinpaprika()
        mockSuccessfulResponseBigNumberOperand()
        const data: AdapterRequest = {
          id: jobID,
          data: {
            endpoint,
            operand1Sources: ['coingecko', 'coinpaprika'],
            operand2Sources: ['bignumberoperand'],
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
        expect(response.body.result).not.toContain('e+')
      })
    })

    describe('erroring calls', () => {
      const jobID = '1'

      it('returns error if not enough sources to reach minAnswers', async () => {
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
          .expect(400)
        expect(response.body).toMatchSnapshot()
      })

      it('returns error if not enough configured sources to reach minAnswers', async () => {
        mockSuccessfulResponseCoingecko()
        const data: AdapterRequest = {
          id: jobID,
          data: {
            endpoint,
            operand1Sources: ['coingecko', 'not_configured_1', 'not_configured_2'],
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

      it('returns error if not reaching minAnswers', async () => {
        mockSuccessfulResponseCoingecko()
        const data: AdapterRequest = {
          id: jobID,
          data: {
            endpoint,
            operand1Sources: ['coingecko', 'failing'],
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

      it('returns error if operand1 has invalid type', async () => {
        mockSuccessfulResponseCoingecko()
        mockSuccessfulResponseCoinpaprika()
        const data: AdapterRequest = {
          id: jobID,
          data: {
            endpoint,
            operand1Sources: 'coingecko,coinpaprika',
            operand2Sources: 'coingecko,coinpaprika',
            operand1Input: false,
            operand2Input: JSON.stringify({
              from: 'ETH',
              to: 'USD',
            }),
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

      it('returns error if operand1 has invalid JSON', async () => {
        mockSuccessfulResponseCoingecko()
        mockSuccessfulResponseCoinpaprika()
        const data: AdapterRequest = {
          id: jobID,
          data: {
            endpoint,
            operand1Sources: 'coingecko,coinpaprika',
            operand2Sources: 'coingecko,coinpaprika',
            operand1Input: 'invalid json',
            operand2Input: JSON.stringify({
              from: 'ETH',
              to: 'USD',
            }),
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

      it('returns error if operand2 has invalid type', async () => {
        mockSuccessfulResponseCoingecko()
        mockSuccessfulResponseCoinpaprika()
        const data: AdapterRequest = {
          id: jobID,
          data: {
            endpoint,
            operand1Sources: 'coingecko,coinpaprika',
            operand2Sources: 'coingecko,coinpaprika',
            operand1Input: JSON.stringify({
              from: 'ETH',
              to: 'USD',
            }),
            operand2Input: 12345,
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

      it('returns error if operand2 has invalid JSON', async () => {
        mockSuccessfulResponseCoingecko()
        mockSuccessfulResponseCoinpaprika()
        const data: AdapterRequest = {
          id: jobID,
          data: {
            endpoint,
            operand1Sources: 'coingecko,coinpaprika',
            operand2Sources: 'coingecko,coinpaprika',
            operand1Input: JSON.stringify({
              from: 'ETH',
              to: 'USD',
            }),
            operand2Input: '{{a: b}',
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

      it('returns success with JSON inputs', async () => {
        mockSuccessfulResponseCoingecko()
        mockSuccessfulResponseCoinpaprika()
        const data: AdapterRequest = {
          id: jobID,
          data: {
            endpoint,
            dividendSources: 'coingecko,coinpaprika',
            divisorSources: 'coingecko,coinpaprika',
            dividendInput: JSON.stringify({
              from: 'LINK',
              to: 'USD',
            }),
            divisorInput: JSON.stringify({
              from: 'ETH',
              to: 'USD',
            }),
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

      it('returns error if not enough sources to reach minAnswers', async () => {
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
          .expect(400)
        expect(response.body).toMatchSnapshot()
      })

      it('returns error if not enough configured sources to reach minAnswers', async () => {
        mockSuccessfulResponseCoingecko()
        const data: AdapterRequest = {
          id: jobID,
          data: {
            endpoint,
            dividendSources: ['coingecko', 'not_configured_1', 'not_configured_2'],
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

      it('returns error if not reaching minAnswers', async () => {
        mockSuccessfulResponseCoingecko()
        const data: AdapterRequest = {
          id: jobID,
          data: {
            endpoint,
            dividendSources: ['coingecko', 'failing'],
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

      it('returns error if dividendInput has invalid JSON', async () => {
        mockSuccessfulResponseCoingecko()
        mockSuccessfulResponseCoinpaprika()
        const data: AdapterRequest = {
          id: jobID,
          data: {
            endpoint,
            dividendSources: 'coingecko,coinpaprika',
            divisorSources: 'coingecko,coinpaprika',
            dividendInput: 'invalid json',
            divisorInput: JSON.stringify({
              from: 'ETH',
              to: 'USD',
            }),
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

      it('returns error if dividendInput has invalid type', async () => {
        mockSuccessfulResponseCoingecko()
        mockSuccessfulResponseCoinpaprika()
        const data: AdapterRequest = {
          id: jobID,
          data: {
            endpoint,
            dividendSources: 'coingecko,coinpaprika',
            divisorSources: 'coingecko,coinpaprika',
            dividendInput: [1, 2, 3],
            divisorInput: JSON.stringify({
              from: 'ETH',
              to: 'USD',
            }),
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

      it('returns error if divisorInput has invalid JSON', async () => {
        mockSuccessfulResponseCoingecko()
        mockSuccessfulResponseCoinpaprika()
        const data: AdapterRequest = {
          id: jobID,
          data: {
            endpoint,
            dividendSources: 'coingecko,coinpaprika',
            divisorSources: 'coingecko,coinpaprika',
            dividendInput: JSON.stringify({
              from: 'ETH',
              to: 'USD',
            }),
            divisorInput: 'invalid json',
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

      it('returns error if divisorInput has invalid type', async () => {
        mockSuccessfulResponseCoingecko()
        mockSuccessfulResponseCoinpaprika()
        const data: AdapterRequest = {
          id: jobID,
          data: {
            endpoint,
            dividendSources: 'coingecko,coinpaprika',
            divisorSources: 'coingecko,coinpaprika',
            dividendInput: JSON.stringify({
              from: 'ETH',
              to: 'USD',
            }),
            divisorInput: true,
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
