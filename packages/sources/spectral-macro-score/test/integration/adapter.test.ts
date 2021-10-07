import { assertSuccess } from '@chainlink/ea-test-helpers'
import { util } from '@chainlink/ea-bootstrap'
import { AdapterRequest } from '@chainlink/types'
import { BigNumber } from 'ethers'
import nock from 'nock'
import sinon from 'sinon'
import { getTickSet } from '../../src/abi/NFC'
import { getNFCAddress } from '../../src/abi/NFCRegistry'
import { makeExecute } from '../../src/adapter'
import * as config from '../../src/config'
import { mockMacroScoreAPIResponseSuccess } from '../mocks/macro-score-api.mock'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  beforeAll(() => {
    if (process.env.RECORD) {
      nock.recorder.rec()
    }
  })

  afterAll(() => {
    if (process.env.RECORD) {
      nock.recorder.play()
    }

    nock.restore()
    nock.cleanAll()
    nock.enableNetConnect()
  })

  describe('successful calls @integration', () => {
    beforeEach(() => {
      if (!process.env.RECORD) {
        mockMacroScoreAPIResponseSuccess()
      }
    })

    const requests = [
      {
        name: 'standard request should succeed',
        shouldFail: false,
        testData: {
          id: jobID,
          data: {
            tokenIdHash: '0xcea3ebf3f8380a57daf9020589ce73cc4ff474d6f005902a341c12a2e8fbbb09', // Replace this if recording Nock mock
            tickSetId: BigNumber.from('1'),
          },
        },
      },
    ]

    const mockContractCall = async () => {
      sinon.mock
      const rpcUrl = `${util.getRequiredEnv('INFURA_URL')}${util.getRequiredEnv('INFURA_API_KEY')}`
      const nfcAddress = await getNFCAddress(util.getRequiredEnv('NFC_REGISTRY_ADDRESS'), rpcUrl)
      const tickSet = await getTickSet(nfcAddress, rpcUrl, BigNumber.from('1'))

      const mockConfig = sinon.mock(config)

      const mockedConfigResult = {
        api: {},
        verbose: true,
        BASE_URL_MACRO_API: util.getRequiredEnv('BASE_URL_MACRO_API'),
        BASE_URL_FAST_API: util.getRequiredEnv('BASE_URL_FAST_API'),
        MACRO_API_KEY: util.getRequiredEnv('MACRO_API_KEY'),
        FAST_API_KEY: util.getRequiredEnv('FAST_API_KEY'),
        INFURA_URL: util.getRequiredEnv('INFURA_URL'),
        INFURA_API_KEY: util.getRequiredEnv('INFURA_API_KEY'),
        NFC_REGISTRY_ADDRESS: util.getRequiredEnv('NFC_REGISTRY_ADDRESS'),
        timeout: config.DEFAULT_TIMEOUT,
      }
      mockConfig.expects('makeConfig').once().returns(mockedConfigResult)

      return tickSet
    }

    requests.forEach((req) => {
      it(
        `${req.name}`,
        async () => {
          await mockContractCall()
          const adapterResponse = await execute(req.testData as AdapterRequest, null)

          assertSuccess(
            { expected: 200, actual: adapterResponse.statusCode },
            adapterResponse,
            jobID,
          )

          expect(parseInt(adapterResponse.data?.result)).not.toBeNull()
          expect(parseInt(adapterResponse.data.result)).toBeGreaterThan(0)
        },
        config.DEFAULT_TIMEOUT,
      )
    })
  })
})
