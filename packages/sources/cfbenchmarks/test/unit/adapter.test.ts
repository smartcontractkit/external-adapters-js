import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { makeExecute } from '../../src/adapter'
import { makeConfig } from '../../src/config'
import { getIdFromInputs, inputParameters } from '../../src/endpoint/values'

let oldEnv: NodeJS.ProcessEnv

beforeAll(() => {
  oldEnv = JSON.parse(JSON.stringify(process.env))
  process.env.CACHE_ENABLED = 'false'
  process.env.API_USERNAME = process.env.API_USERNAME || 'test_username'
  process.env.API_PASSWORD = process.env.API_PASSWORD || 'test_password'
})

afterAll(() => {
  process.env = oldEnv
})

describe('execute', () => {
  const id = '1'
  const execute = makeExecute()

  describe('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest, {})
        } catch (error) {
          const errorResp = Requester.errored(id, error)
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, id)
        }
      })
    })
  })

  describe('getIdFromInputs', () => {
    const tests: { name: string; input: AdapterRequest; output: string; useSecondary: boolean }[] =
      [
        {
          name: 'uses index if present',
          input: { id, data: { index: 'BRTI' } },
          output: 'BRTI',
          useSecondary: false,
        },
        {
          name: 'uses from/to if present',
          input: { id, data: { from: 'ETH', to: 'USD' } },
          output: 'ETHUSD_RTI',
          useSecondary: false,
        },
        {
          name: 'uses aliases base/quote if present',
          input: { id, data: { base: 'USDT', quote: 'USD' } },
          output: 'USDTUSD_RTI',
          useSecondary: false,
        },
        {
          name: 'ignores from/to if index present',
          input: { id, data: { index: 'LINKUSD_RTI', from: 'ETH', to: 'USD' } },
          output: 'LINKUSD_RTI',
          useSecondary: false,
        },
        {
          name: 'maps BTC/USD to BRTI',
          input: { id, data: { from: 'BTC', to: 'USD' } },
          output: 'BRTI',
          useSecondary: false,
        },
        {
          name: 'maps SOL/USD to SOLUSD_RTI if not using secondary endpoint',
          input: { id, data: { from: 'SOL', to: 'USD' } },
          output: 'SOLUSD_RTI',
          useSecondary: false,
        },
        {
          name: 'maps SOL/USD to U_SOLUSD_RTI if using secondary endpoint',
          input: { id, data: { from: 'SOL', to: 'USD' } },
          output: 'U_SOLUSD_RTI',
          useSecondary: true,
        },
      ]

    tests.forEach((test) => {
      it(`${test.name}`, async () => {
        const validator = new Validator(test.input, inputParameters)
        const config = makeConfig()
        config.useSecondary = test.useSecondary
        expect(getIdFromInputs(config, validator)).toEqual(test.output)
      })
    })
  })
})
