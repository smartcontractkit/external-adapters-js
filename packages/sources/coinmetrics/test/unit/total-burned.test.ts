import { Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { ethers, BigNumber } from 'ethers'
import { makeExecute } from '../../src/adapter'
import { AssetMetrics, calculateBurnedTKN } from '../../src/endpoint/total-burned'

describe('validation error', () => {
  process.env.API_KEY = process.env.API_KEY || 'test_api_key'

  const execute = makeExecute()

  it(`asset not supplied`, async () => {
    const testData = {
      id: '1',
      data: {
        endpoint: 'total-burned',
      },
    }
    try {
      await execute(testData as AdapterRequest)
    } catch (error) {
      const errorResp = Requester.errored(testData.id, error)
      assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, testData.id)
    }
  })
})

describe('calculateBurnedTKN()', () => {
  const testCasesError = [
    {
      name: 'FeeTotNtv is missing',
      testData: {
        jobRunID: '1',
        assetMetricsList: [
          {
            RevNtv: '42',
            IssTotNtv: '777',
          },
        ],
      },
    },
    {
      name: 'RevNtv is missing',
      testData: {
        jobRunID: '1',
        assetMetricsList: [
          {
            FeeTotNtv: '42',
            IssTotNtv: '777',
          },
        ],
      },
    },
    {
      name: 'IssTotNtv is missing',
      testData: {
        jobRunID: '1',
        assetMetricsList: [
          {
            FeeTotNtv: '42',
            RevNtv: '777',
          },
        ],
      },
    },
    {
      name: 'FeeTotNtv is unprocessable',
      testData: {
        jobRunID: '1',
        assetMetricsList: [
          {
            FeeTotNtv: 'unprocessable',
            RevNtv: '42',
            IssTotNtv: '777',
          },
        ],
      },
    },
    {
      name: 'RevNtv is unprocessable',
      testData: {
        jobRunID: '1',
        assetMetricsList: [
          {
            FeeTotNtv: '42',
            RevNtv: 'unprocessable',
            IssTotNtv: '777',
          },
        ],
      },
    },
    {
      name: 'IssTotNtv is unprocessable',
      testData: {
        jobRunID: '1',
        assetMetricsList: [
          {
            FeeTotNtv: '42',
            RevNtv: '777',
            IssTotNtv: 'unprocessable',
          },
        ],
      },
    },
  ]

  testCasesError.forEach((testCase) => {
    it(`throws an Error when ${testCase.name}`, async () => {
      expect(() =>
        calculateBurnedTKN(testCase.testData.assetMetricsList as AssetMetrics[]),
      ).toThrow()
    })
  })

  const testCasesSuccess = [
    {
      name: 'zero when there are no asset metrics',
      testData: {
        jobRunID: '1',
        assetMetricsList: [],
        expectedOutput: BigNumber.from('0'),
      },
    },
    {
      name: 'the expected value',
      testData: {
        jobRunID: '1',
        assetMetricsList: [
          {
            FeeTotNtv: '6253.96108770342420449',
            RevNtv: '16433.128000846204783707',
            IssTotNtv: '13232.9375',
          },
        ],
        expectedOutput: ethers.utils.parseEther('3053.770586857219420783'),
      },
    },
  ]

  testCasesSuccess.forEach((testCase) => {
    it(`returns ${testCase.name}`, async () => {
      expect(calculateBurnedTKN(testCase.testData.assetMetricsList as AssetMetrics[])).toEqual(
        testCase.testData.expectedOutput,
      )
    })
  })
})
