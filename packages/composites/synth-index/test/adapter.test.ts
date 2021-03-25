import { assert } from 'chai'
import sinon, { createSandbox } from 'sinon'
import { assertSuccess, assertError } from '@chainlink/ea-test-helpers'
import { Requester } from '@chainlink/ea-bootstrap'
import { Execute, AdapterRequest } from '@chainlink/types'
import synth_index from '../src'
import { Config } from '../src/config'
import snx from 'synthetix'
import { AdapterStubs } from './stubs'

/* Helper Utils*/
// TODO: move to core/test-utils
const setupEnvironment = () => {
  process.env.TOKEN_ALLOCATION_DATA_PROVIDER_URL = 'http://test/TOKEN_ALLOCATION'
}

const useUnderlying = () => {
  return before(() => {
    setupEnvironment()
  })
}

describe(synth_index.NAME, () => {
  let execute: Execute
  let config: Config
  let sandbox: sinon.SinonSandbox
  let server: sinon.SinonFakeServer

  useUnderlying()

  beforeEach(() => {
    execute = synth_index.makeExecute()
    config = synth_index.makeConfig()
    sandbox = createSandbox()
    server = sandbox.useFakeServer()
  })
  afterEach(() => {
    server.restore()
    sandbox.restore()
  })

  context('successful calls', () => {
    const jobID = '1'

    const requests = [
      {
        name: 'successful adapter call',
        input: {
          id: jobID,
          data: {
            base: 'sDEFI',
            source: 'coingecko',
          },
        },
        output: 40.12795,
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const HTTP = sandbox.stub(Requester, 'request').returns(
          new Promise<any>((resolve, reject) => {
            const response = AdapterStubs.TOKEN_ALLOCATION
            response ? resolve(response) : reject('Mock Failure')
          }),
        )
        sandbox.stub(snx, 'getSynths').returns(AdapterStubs.SYNTHETIX)

        const data = await execute(req.input)
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        assert.equal(data.result, req.output)
        assert.equal(data.data.result, req.output)
      })
    })
  })

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
