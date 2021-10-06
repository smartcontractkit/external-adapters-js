import { assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { BigNumber } from 'ethers'
import nock from 'nock'
import sinon from 'sinon'
import * as NFC from '../../src/abi/NFC'
import * as NFCRegistry from '../../src/abi/NFCRegistry'
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
            tokenIdHash: '0x1a8b05acc3013b2d34a747a85d7d878597bdb177c31c6d0a06b9e654817a9582', // Replace this if recording Nock mock
            tickSetId: BigNumber.from('1'),
          },
        },
      },
    ]

    const mockContractCall = async () => {
      sinon.mock
      const rpcUrl = 'https://kovan.infura.io/v3/8d56dbce524d46a584cbc039a6d48fd0'
      const nfcAddress = await getNFCAddress('0x6C29d5D08c9751Ac38Cc8E1a7a4cb75951548A15', rpcUrl)
      const tickSet = await getTickSet(nfcAddress, rpcUrl, BigNumber.from('1'))

      const mockConfig = sinon.mock(config)

      const mockedConfigResult = {
        api: {
          baseURL: 'https://macro-api-staging.spectral.finance/api',
        },
        verbose: true,
        rpcUrl: 'https://kovan.infura.io/v3/8d56dbce524d46a584cbc039a6d48fd0',
        nfcRegistryAddress: '0x6C29d5D08c9751Ac38Cc8E1a7a4cb75951548A15',
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
