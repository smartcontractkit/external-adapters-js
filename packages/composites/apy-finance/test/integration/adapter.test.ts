import { AdapterRequest, Execute } from '@chainlink/types'
import nock from 'nock'
import * as apyFinanceAdapter from '../../src/index'
import { mockEthereumCalls, mockTiingoResponse } from './fixtures'
let oldEnv: NodeJS.ProcessEnv

describe('execute', () => {
  let execute: Execute
  const id = '1'

  beforeAll(() => {
    execute = apyFinanceAdapter.makeExecute()
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.CACHE_ENABLED = 'false'
    process.env.REGISTRY_ADDRESS =
      process.env.REGISTRY_ADDRESS || '0x7ec81b7035e91f8435bdeb2787dcbd51116ad303'
    process.env.TIINGO_DATA_PROVIDER_URL =
      process.env.TIINGO_DATA_PROVIDER_URL || 'http://localhost:3000'
    process.env.RPC_URL = process.env.RPC_URL || 'https://geth-main.eth.devnet.tools'
  })

  afterAll(() => {
    process.env = oldEnv
    if (process.env.RECORD) {
      nock.recorder.play()
    }

    nock.restore()
    nock.cleanAll()
    nock.enableNetConnect()
  })

  describe('with request properly formatted', () => {
    mockTiingoResponse()
    mockEthereumCalls()
    const data: AdapterRequest = {
      id,
      data: {
        source: 'tiingo',
      },
    }

    it.skip('should return success', async () => {
      const resp = await execute(data, {})
      expect(resp).toMatchSnapshot()
    })
  })
})
