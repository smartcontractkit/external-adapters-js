import { assert } from 'chai'
import sinon, { createSandbox } from 'sinon'
import { assertSuccess, assertError } from '@chainlink/ea-test-helpers'
import { Requester } from '@chainlink/ea-bootstrap'
import { Execute, AdapterRequest } from '@chainlink/types'
import apy_finance from '../src'
import { Config } from '../src/config'
import { AdapterStubs } from './stubs'

/* Helper Utils*/
// TODO: move to core/test-utils
const setupEnvironment = () => {
  process.env.TOKEN_ALLOCATION_DATA_PROVIDER_URL = 'http://test/TOKEN_ALLOCATION'
  process.env.RPC_URL = 'http://test/RPC_URL'
  process.env.REGISTRY_ADDRESS = '0xtest'
}

const useUnderlying = () => {
  return before(() => {
    setupEnvironment()
  })
}

describe(apy_finance.NAME, () => {
  let execute: Execute
  let config: Config
  let sandbox: sinon.SinonSandbox
  let server: sinon.SinonFakeServer

  useUnderlying()

  beforeEach(() => {
    execute = apy_finance.makeExecute()
    config = apy_finance.makeConfig()
    sandbox = createSandbox()
    server = sandbox.useFakeServer()
  })
  afterEach(() => {
    server.restore()
    sandbox.restore()
  })

  //   context('successful calls', () => {
  //     const jobID = '1'

  //     const requests = [
  //       {
  //         name: 'successful adapter call',
  //         input: {
  //           id: jobID,
  //           data: {
  //             source: 'coingecko',
  //           },
  //         },
  //         output: 40.12795,
  //       },
  //     ]

  //     requests.forEach((req) => {
  //       it(`${req.name}`, async () => {
  //         const HTTP = sandbox.stub(Requester, 'request').returns(
  //           new Promise<any>((resolve, reject) => {
  //             const response = AdapterStubs.TOKEN_ALLOCATION
  //             response ? resolve(response) : reject('Mock Failure')
  //           }),
  //         )

  //         // TODO: mock ethers contract (registry)
  //         // sandbox.stub().returns(AdapterStubs.REGISTRY)

  //         const data = await execute(req.input)
  //         assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
  //         assert.equal(data.result, req.output)
  //         assert.equal(data.data.result, req.output)
  //       })
  //     })
  //   })

  context('validation error', () => {
    const jobID = '1'

    const requests = [
      { name: 'empty body', input: {} },
      { name: 'empty data', input: { data: {} } },
      {
        name: 'asset not supplied',
        input: { id: jobID, data: {} },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.input as AdapterRequest)
        } catch (error) {
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })

  context('error calls @integration', () => {
    const jobID = '1'

    const requests = [
      {
        name: 'invalid asset',
        input: {
          id: jobID,
          data: { asset: 'INVALID_ASSET', source: 'coingecko' },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.input)
        } catch (error) {
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
