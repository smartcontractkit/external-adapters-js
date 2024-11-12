import { assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest, Execute } from '@chainlink/ea-bootstrap'
import { BigNumber } from 'ethers'
import nock from 'nock'
import sinon from 'sinon'
import * as NFC from '../../src/abi/NFC'
import { makeExecute } from '../../src/adapter'
import * as config from '../../src/config'
import { mockMacroScoreAPIResponseSuccess } from '../mocks/macro-score-api.mock'
import { TInputParameters } from '../../src/endpoint'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute() as Execute

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
            tokenIdInt: 'test', // Replace this if recording Nock mock
            tickSetId: '1',
          },
        },
      },
    ]

    const mockContractCall = () => {
      const mockNFC = sinon.mock(NFC)
      const mockedResult = [
        BigNumber.from('440'),
        BigNumber.from('530'),
        BigNumber.from('620'),
        BigNumber.from('710'),
        BigNumber.from('800'),
      ]
      mockNFC.expects('getTickSet').once().returns(Promise.resolve(mockedResult))
      const mockConfig = sinon.mock(config)
      const mockedConfigResult = {
        api: {
          baseURL: 'https://xzff24vr3m.execute-api.us-east-2.amazonaws.com/default/',
        },
        verbose: true,
        rpcUrl: 'test-rpc-url',
        nfcAddress: 'test-nfc-address',
      }
      mockConfig.expects('makeConfig').once().returns(mockedConfigResult)
    }

    requests.forEach((req) => {
      it(
        `${req.name}`,
        async () => {
          mockContractCall()
          const adapterResponse = await execute(
            req.testData as AdapterRequest<TInputParameters>,
            {},
          )
          assertSuccess(
            { expected: 200, actual: adapterResponse.statusCode },
            adapterResponse,
            jobID,
          )
          expect(
            adapterResponse?.data?.result && parseInt(adapterResponse?.data?.result?.toString()),
          ).not.toBeNull()
          expect(
            adapterResponse?.data?.result && parseInt(adapterResponse?.data?.result?.toString()),
          ).toBeGreaterThan(0)
        },
        config.DEFAULT_TIMEOUT,
      )
    })
  })
})
