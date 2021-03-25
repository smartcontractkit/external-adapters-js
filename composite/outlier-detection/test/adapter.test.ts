import { assert } from 'chai'
import sinon, { createSandbox } from 'sinon'
import { assertSuccess, assertError } from '@chainlink/adapter-test-helpers'
import { Requester } from '@chainlink/external-adapter'
import { AdapterImplementation, Execute } from '@chainlink/types'
import outlier_detection from '../src'
import { adapters as sources } from '../src/source'
import { adapters as checks } from '../src/check'
import { Config, ENV_DATA_PROVIDER_URL } from '../src/config'

const AdapterStubs: Record<string, any> = {
  XBTO: {
    jobRunID: '1',
    data: {
      index: 40.12795,
      duration: 35.71406,
      '1st_sym': 'BRNF1',
      '1st_dte': 27.13591,
      '1st_mid': 40.005,
      '1st_wt': 0.7140615,
      '2nd_sym': 'BRNG1',
      '2nd_dte': 57.13591,
      '2nd_mid': 40.435,
      '2nd_wt': 0.2859385,
      '3rd_sym': 'BRNH1',
      '3rd_dte': 87.13591,
      '3rd_mid': 40.865,
      '3rd_wt': 0,
      result: 40.12795,
    },
    result: 40.12795,
    statusCode: 200,
  },
  GENESIS_VOLATILITY: {
    jobRunID: '1',
    data: {
      index: 40.12795,
      duration: 35.71406,
      '1st_sym': 'BRNF1',
      '1st_dte': 27.13591,
      '1st_mid': 40.005,
      '1st_wt': 0.7140615,
      '2nd_sym': 'BRNG1',
      '2nd_dte': 57.13591,
      '2nd_mid': 40.435,
      '2nd_wt': 0.2859385,
      '3rd_sym': 'BRNH1',
      '3rd_dte': 87.13591,
      '3rd_mid': 40.865,
      '3rd_wt': 0,
      result: 40.12795,
    },
    result: 40.12795,
    statusCode: 200,
  },
  DXFEED: false,
}

/* Helper Utils*/
// TODO: move to core/test-utils
const setupEnvironment = (adapters: AdapterImplementation[]) => {
  for (const a of adapters) {
    process.env[`${a.NAME}_${ENV_DATA_PROVIDER_URL}`] = `http://test/${a.NAME}`
  }
}
// const startServices = (adapters: AdapterImplementation[]) => {}
// const cleanupEnvironment = (adapters: AdapterImplementation[]) => {}
// const cleanupServices = (services: any[]) => {}
const useUnderlying = (adapters: AdapterImplementation[]) => {
  // let services: any = []
  return before(() => {
    setupEnvironment(adapters)
    // services = startServices(adapters)
  })
  // after: () => {
  //   cleanupEnvironment(adapters)
  //   cleanupServices(services)
  // },
}

describe(outlier_detection.NAME, () => {
  let execute: Execute
  let config: Config
  let sandbox: sinon.SinonSandbox
  let server: sinon.SinonFakeServer

  beforeEach(() => {
    execute = outlier_detection.makeExecute()
    config = outlier_detection.makeConfig()
    sandbox = createSandbox()
    server = sandbox.useFakeServer()
  })
  afterEach(() => {
    server.restore()
    sandbox.restore()
  })

  useUnderlying([...sources, ...checks])
  before(() => ({}))

  context('successful calls', () => {
    const jobID = '1'

    const requests = [
      {
        name: 'successful adapter call',
        input: {
          id: jobID,
          data: {
            contract: '0x00',
            multiply: 1,
            source: 'XBTO',
            asset: 'BRENT',
          },
          meta: { latestAnswer: 999 },
        },
        output: 40.12795,
      },
      {
        name: 'comma separated sources',
        input: {
          id: jobID,
          data: {
            contract: '0x00',
            multiply: 1,
            source: 'XBTO,GENESIS_VOLATILITY',
            asset: 'BRENT',
          },
          meta: { latestAnswer: 999 },
        },
        output: 40.12795,
      },
      {
        name: 'still works with failing adapters',
        input: {
          id: jobID,
          data: {
            contract: '0x00',
            multiply: 1,
            source: 'XBTO,DXFEED',
            asset: 'BRENT',
          },
          meta: { latestAnswer: 999 },
        },
        output: 40.12795,
      },
      {
        name: 'still works with failing adapters with checks',
        input: {
          id: jobID,
          data: {
            contract: '0x00',
            multiply: 1,
            source: 'XBTO',
            asset: 'BRENT',
            check: 'DERIBIT,DXFEED',
          },
          meta: { latestAnswer: 999 },
        },
        output: 40.12795,
      },
      {
        name: 'returns onchain value when check threshold is surpassed',
        input: {
          id: jobID,
          data: {
            contract: '0x00',
            multiply: 1,
            source: 'XBTO',
            asset: 'BRENT',
            onchain_threshold: 10,
          },
          meta: { latestAnswer: 999 },
        },
        output: 999,
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const HTTP = sandbox.stub(Requester, 'request')
        for (const stub in AdapterStubs) {
          HTTP.withArgs({ ...config.sources[stub], data: req.input }).returns(
            new Promise<any>((resolve, reject) => {
              const response = AdapterStubs[stub]
              response ? resolve(response) : reject('Mock Failure')
            }),
          )
        }
        const data = await execute(req.input)
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        assert.equal(data.result, req.output)
        assert.equal(data.data.result, req.output)
      })
    })
  })

  context('validation error', () => {
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
            contract: '0x00',
            multiply: 1,
            source: 'NOT_REAL',
            asset: 'BRENT',
          },
          meta: { latestAnswer: 999 },
        },
        output: 999,
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
