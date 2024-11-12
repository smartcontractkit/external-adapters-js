import { AdapterError, Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { makeExecute } from '../../src/adapter'
import { TInputParameters } from '../../src/endpoint'
import {
  encodeCurrentConditionsResult,
  getCurrentConditionsResult,
  CurrentConditions,
  CurrentConditionsResult,
  Unit,
} from '../../src/endpoint/current-conditions'
import { testCurrentConditions } from './helpers'

describe('validation error', () => {
  const jobID = '1'
  const execute = makeExecute()

  process.env.API_KEY = 'test_api_key'

  const requests = [
    {
      name: 'locationKey not supplied',
      id: '1',
      testData: {
        data: {
          endpoint: 'current-conditions',
          units: Unit.IMPERIAL,
        },
      },
    },
    {
      name: 'units not supplied',
      id: '1',
      testData: {
        data: {
          endpoint: 'current-conditions',
          locationKey: 777,
        },
      },
    },
  ]
  requests.forEach((req) => {
    it(`${req.name}`, async () => {
      try {
        await execute(req.testData as AdapterRequest<TInputParameters>, {})
      } catch (error) {
        const errorResp = Requester.errored(jobID, error as AdapterError)
        assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
      }
    })
  })
})

describe('getCurrentConditionsResult()', () => {
  const testCasesError = [
    {
      name: 'currentConditionsList has no items',
      testData: {
        units: Unit.METRIC,
        currentConditionsList: [],
      },
    },
    {
      name: 'currentConditionsList has more than one item',
      testData: {
        units: Unit.METRIC,
        currentConditionsList: ['item1', 'item2'],
      },
    },
    {
      name: 'units is not supported',
      testData: {
        units: 'unknownSystem',
        currentConditionsList: ['item1'],
      },
    },
    {
      name: 'currentConditions is missing data',
      testData: {
        units: Unit.METRIC,
        currentConditionsList: [
          {
            PrecipitationSummary: {
              Past12Hours: {
                Metric: {
                  Value: 1.11,
                },
              },
              Past24Hours: {
                Metric: {
                  Value: 1.22,
                },
              },
              PastHour: {
                Metric: {
                  Value: 1.33,
                },
              },
            },
            PrecipitationType: 'Hail', // Not existing in AccuWeather
            Pressure: {
              Metric: {
                Value: 2.11,
              },
            },
            RelativeHumidity: 42,
            Temperature: {
              Metric: {
                Value: 31.4,
              },
            },
            EpochTime: 1505597189,
            UVIndex: 1,
            WeatherIcon: 13,
            Wind: {
              Direction: {
                Degrees: 77,
              },
              Speed: {
                Metric: {
                  Value: 88.8,
                },
              },
            },
          },
        ],
      },
    },
    {
      name: 'currentConditions contains not integers',
      testData: {
        units: Unit.METRIC,
        currentConditionsList: [
          {
            PrecipitationSummary: {
              Past12Hours: {
                Metric: {
                  Value: 1.111,
                },
              },
              Past24Hours: {
                Metric: {
                  Value: 1.22,
                },
              },
              PastHour: {
                Metric: {
                  Value: 1.33,
                },
              },
            },
            PrecipitationType: 'Rain',
            Pressure: {
              Metric: {
                Value: 2.11,
              },
            },
            RelativeHumidity: 42.77, // Not an integer
            Temperature: {
              Metric: {
                Value: 31.4,
              },
            },
            EpochTime: 1505597189,
            UVIndex: 1,
            WeatherIcon: 13,
            Wind: {
              Direction: {
                Degrees: 77,
              },
              Speed: {
                Metric: {
                  Value: 88.8,
                },
              },
            },
          },
        ],
      },
    },
  ]
  testCasesError.forEach((testCase) => {
    it(`throws an error when ${testCase.name}`, async () => {
      expect(() =>
        getCurrentConditionsResult(
          testCase.testData.units as Unit,
          testCase.testData.currentConditionsList as CurrentConditions[],
        ),
      ).toThrow()
    })
  })

  it('parses the API response data in metric units', () => {
    const currentConditionsResult = getCurrentConditionsResult(Unit.METRIC, [testCurrentConditions])

    const expectedCurrentConditionsResult: CurrentConditionsResult = {
      precipitationPast12Hours: 640,
      precipitationPast24Hours: 800,
      precipitationPastHour: 150,
      precipitationType: 1,
      pressure: 101020,
      relativeHumidity: 83,
      temperature: 259,
      timestamp: 1634841000,
      uvIndex: 0,
      weatherIcon: 15,
      windDirectionDegrees: 293,
      windSpeed: 66,
    }
    expect(currentConditionsResult).toEqual(expectedCurrentConditionsResult)
  })

  it('parses the API response data in imperial units', () => {
    const currentConditionsResult = getCurrentConditionsResult(Unit.IMPERIAL, [
      testCurrentConditions,
    ])

    const expectedCurrentConditionsResult: CurrentConditionsResult = {
      precipitationPast12Hours: 25,
      precipitationPast24Hours: 32,
      precipitationPastHour: 6,
      precipitationType: 1,
      pressure: 2983,
      relativeHumidity: 83,
      temperature: 790,
      timestamp: 1634841000,
      uvIndex: 0,
      weatherIcon: 15,
      windDirectionDegrees: 293,
      windSpeed: 41,
    }
    expect(currentConditionsResult).toEqual(expectedCurrentConditionsResult)
  })
})

describe('encodeCurrentConditionsResult()', () => {
  it('encodes the endpoint result', () => {
    const currentConditionsResult: CurrentConditionsResult = {
      precipitationPast12Hours: 640,
      precipitationPast24Hours: 800,
      precipitationPastHour: 150,
      precipitationType: 1,
      pressure: 101020,
      relativeHumidity: 83,
      temperature: 259,
      timestamp: 1634841000,
      uvIndex: 0,
      weatherIcon: 15,
      windDirectionDegrees: 293,
      windSpeed: 66,
    }

    const encodedResult = encodeCurrentConditionsResult(currentConditionsResult)

    const expectedEncodedResult =
      '0x000000000000000000000000000000000000000000000000000000006171b1a80000000000000000000000000000000000000000000000000000000000000280000000000000000000000000000000000000000000000000000000000000032000000000000000000000000000000000000000000000000000000000000000960000000000000000000000000000000000000000000000000000000000018a9c000000000000000000000000000000000000000000000000000000000000010300000000000000000000000000000000000000000000000000000000000001250000000000000000000000000000000000000000000000000000000000000042000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000530000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f'
    expect(encodedResult).toBe(expectedEncodedResult)
  })
})
