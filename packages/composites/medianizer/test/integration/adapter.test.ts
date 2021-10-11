import sinon, { createSandbox } from 'sinon'
import { assertSuccess, assertError } from '@chainlink/ea-test-helpers'
import { Requester } from '@chainlink/ea-bootstrap'
import { Execute, Config } from '@chainlink/types'
import { util } from '@chainlink/ea-bootstrap'
import { makeExecute } from '../../src/adapter'
import { makeConfig } from '../../src/config'

const AdapterStubs: Record<string, any> = {
  COINGECKO: {
    jobRunID: '1',
    data: {
      result: 1000,
    },
    result: 1000,
    statusCode: 200,
  },
  COINPAPRIKA: {
    jobRunID: '1',
    data: {
      result: 2000,
    },
    result: 2000,
    statusCode: 200,
  },
}

const setupEnvironment = (adapters: string[]) => {
  for (const a of adapters) {
    process.env[`${a.toUpperCase()}_${util.ENV_ADAPTER_URL}`] = `http://test/${a}`
  }
}

describe('medianizer', () => {
  let execute: Execute
  let config: Config
  let sandbox: sinon.SinonSandbox
  let server: sinon.SinonFakeServer

  beforeEach(() => {
    execute = makeExecute()
    config = makeConfig()
    sandbox = createSandbox()
    server = sandbox.useFakeServer()
  })
  afterEach(() => {
    server.restore()
    sandbox.restore()
  })

  setupEnvironment(['coingecko', 'coinpaprika', 'failing'])
  beforeAll(() => ({}))

  describe('successful calls', () => {
    const jobID = '1'

    const requests = [
      {
        name: 'successful adapter call',
        input: {
          id: jobID,
          data: {
            sources: ['coingecko', 'coinpaprika'],
            from: 'ETH',
            to: 'USD',
          },
        },
        output: 1500,
      },
      {
        name: 'comma separated sources',
        input: {
          id: jobID,
          data: {
            sources: 'coingecko,coinpaprika',
            from: 'ETH',
            to: 'USD',
          },
        },
        output: 1500,
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const HTTP = sandbox.stub(Requester, 'request')
        for (const stub in AdapterStubs) {
          HTTP.withArgs({
            ...config.api,
            method: 'post',
            url: process.env[`${stub.toUpperCase()}_${util.ENV_ADAPTER_URL}`],
            data: req.input,
          }).returns(new Promise<any>((resolve) => resolve(AdapterStubs[stub])))
        }
        const data = await execute(req.input, {})
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        expect(data.result).toEqual(req.output)
        expect(data.data.result).toEqual(req.output)
      })
    })
  })

  describe('erroring calls', () => {
    const jobID = '1'

    const requests = [
      {
        name: 'returns error if not reaching minAnswers',
        input: {
          id: jobID,
          data: {
            sources: 'coingecko',
            from: 'ETH',
            to: 'USD',
            minAnswers: 2,
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const HTTP = sandbox.stub(Requester, 'request')
        for (const stub in AdapterStubs) {
          HTTP.withArgs({
            ...config.api,
            method: 'post',
            url: process.env[`${stub.toUpperCase()}_${util.ENV_ADAPTER_URL}`],
            data: req.input,
          }).returns(new Promise<any>((resolve) => resolve(AdapterStubs[stub])))
        }
        try {
          await await execute(req.input, {})
        } catch (error) {
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 500, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })

  describe('validation error', () => {
    const jobID = '2'

    const requests = [
      {
        name: 'empty data',
        input: { id: jobID, data: {} },
      },
      {
        name: 'unsupported source',
        input: {
          id: jobID,
          data: {
            source: 'NOT_REAL',
            from: 'ETH',
            to: 'USD',
          },
        },
        output: 999,
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.input, {})
        } catch (error) {
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
