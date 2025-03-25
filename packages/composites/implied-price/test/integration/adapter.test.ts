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
  describe('successful calls', () => {
    const jobID = '1'

    describe('with operand1 and operand2 parameters', () => {
      it('return success without comma separated sources', async () => {
        mockSuccessfulResponseCoingecko()
        mockSuccessfulResponseCoinpaprika()
        const data: AdapterRequest = {
          id: jobID,
          data: {
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

    describe('with dividend and divisor parameters', () => {
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

      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(500)
      expect(response.body).toMatchSnapshot()
    })

    it('returns a validation error if dividendSources are missing', async () => {
      const data: AdapterRequest = {
        id: jobID,
        data: {
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
        .expect(400)
      expect(response.body).toMatchSnapshot()
    })

    it('returns a validation error if divisorSources are missing', async () => {
      const data: AdapterRequest = {
        id: jobID,
        data: {
          dividendSources: ['coingecko', 'coinpaprika'],
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

    it('returns a validation error if dividendInput is missing', async () => {
      const data: AdapterRequest = {
        id: jobID,
        data: {
          dividendSources: ['coingecko', 'coinpaprika'],
          divisorSources: ['coingecko', 'coinpaprika'],
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

    it('returns a validation error if divisorInput is missing', async () => {
      const data: AdapterRequest = {
        id: jobID,
        data: {
          dividendSources: ['coingecko', 'coinpaprika'],
          divisorSources: ['coingecko', 'coinpaprika'],
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

    it('returns a validation error if operand1Sources are missing', async () => {
      const data: AdapterRequest = {
        id: jobID,
        data: {
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
        .expect(400)
      expect(response.body).toMatchSnapshot()
    })

    it('returns a validation error if operand2Sources are missing', async () => {
      const data: AdapterRequest = {
        id: jobID,
        data: {
          operand1Sources: ['coingecko', 'coinpaprika'],
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

    it('returns a validation error if operand1Input is missing', async () => {
      const data: AdapterRequest = {
        id: jobID,
        data: {
          operand1Sources: ['coingecko', 'coinpaprika'],
          operand2Sources: ['coingecko', 'coinpaprika'],
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

    it('returns a validation error if operand2Input is missing', async () => {
      const data: AdapterRequest = {
        id: jobID,
        data: {
          operand1Sources: ['coingecko', 'coinpaprika'],
          operand2Sources: ['coingecko', 'coinpaprika'],
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

    it('returns a validation error if operation is missing', async () => {
      const data: AdapterRequest = {
        id: jobID,
        data: {
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

    it('returns a validation error if operation is used with dividend and divisor', async () => {
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

    it('returns a validation error if additional operand parameters are given', async () => {
      const data: AdapterRequest = {
        id: jobID,
        data: {
          dividendSources: ['coingecko', 'coinpaprika'],
          divisorSources: ['coingecko', 'coinpaprika'],
          operand1Sources: ['coingecko', 'coinpaprika'],
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

    it('returns a validation error if additional dividend parameters are given', async () => {
      const data: AdapterRequest = {
        id: jobID,
        data: {
          operand1Sources: ['coingecko', 'coinpaprika'],
          dividendSources: ['coingecko', 'coinpaprika'],
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
        .expect(400)
      expect(response.body).toMatchSnapshot()
    })

    it('returns a validation error if parameters are mixed', async () => {
      const data: AdapterRequest = {
        id: jobID,
        data: {
          dividendSources: ['coingecko', 'coinpaprika'],
          operand2Sources: ['coingecko', 'coinpaprika'],
          dividendInput: {
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
  })
})
