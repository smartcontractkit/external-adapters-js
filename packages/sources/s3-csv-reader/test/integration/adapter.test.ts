import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'

jest.mock('@aws-sdk/client-s3', () => {
  const originalModule = jest.requireActual('@aws-sdk/client-s3')
  return {
    ...originalModule,
    S3Client: jest.fn().mockImplementation(() => {
      return {
        send: jest.fn().mockImplementation(async (command) => {
          if (command.constructor.name === 'GetObjectCommand') {
            if (command.input.Bucket == 's3-bucket') {
              if (command.input.Key == 'correct/path/file-01-01-2001.csv') {
                return {
                  Body: {
                    transformToString: () =>
                      'Date,01/01/01,\nName,Value,Other\nRowOne,123,Other1\nRowTwo,456,Other2\nRowThree,789,Other3',
                  },
                }
              }

              if (command.input.Key == 'correct/path/invalid-01-01-2001.csv') {
                return {
                  Body: {
                    transformToString: () => '#invalidCSV"',
                  },
                }
              }

              if (command.input.Key == 'correct/path/empty-01-01-2001.csv') {
                return {
                  Body: {
                    transformToString: () => '',
                  },
                }
              }

              if (command.input.Key == 'correct/path/single-header-01-01-2001.csv') {
                return {
                  Body: {
                    transformToString: () =>
                      'Name,Value,Other\nRowOne,123,Other1\nRowTwo,456,Other2\nRowThree,789,Other3',
                  },
                }
              }

              if (command.input.Key == 'correct/path/multiple-matches-01-01-2001.csv') {
                return {
                  Body: {
                    transformToString: () =>
                      'Date,01/01/01,\nName,Value,Other\nRowOne,123,Other1\nRowOne,456,Other1\nRowOne,789,Other1',
                  },
                }
              }

              throw new Error('Error: The specified key does not exist.')
            }
          } else if (command.constructor.name === 'HeadBucketCommand') {
            if (command.input.Bucket == 's3-bucket') {
              return true
            }
            throw new Error(`The specified bucket ${command.input.Bucket} does not exist.`)
          } else if (command.constructor.name === 'HeadObjectCommand') {
            if (command.input.Key == 'incorrect/path/file-01-01-2001.csv') {
              throw new Error('Invalid key')
            }
            return true
          }
        }),
      }
    }),
  }
})

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  jest.setTimeout(10000)

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.API_KEY = process.env.API_KEY ?? 'fake-api-key'
    process.env.BACKGROUND_EXECUTE_MS = '1000'
    process.env.LOOKBACK_DAYS = '1'

    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('./../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    spy.mockRestore()
    jest.clearAllMocks()
  })

  describe('csv endpoint', () => {
    it('should return success', async () => {
      const request = {
        endpoint: 'csv',
        bucket: 's3-bucket',
        keyPrefix: 'correct/path/file',
        headerRow: 2,
        resultColumn: 'Value',
        matcherColumn: 'Name',
        matcherValue: 'RowTwo',
      }

      const response = await testAdapter.request(request)

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return 400 for invalid bucket name', async () => {
      const request = {
        endpoint: 'csv',
        bucket: 'invalid_s3_bucket#$%^',
        keyPrefix: 'incorrect/path/file',
        headerRow: 2,
        resultColumn: 'Value',
        matcherColumn: 'Name',
        matcherValue: 'RowTwo',
      }

      const response = await testAdapter.request(request)

      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return 400 for invalid keyPrefix name', async () => {
      const request = {
        endpoint: 'csv',
        bucket: 'valid-s3-bucket',
        keyPrefix: 'invalid^$@path',
        headerRow: 2,
        resultColumn: 'Value',
        matcherColumn: 'Name',
        matcherValue: 'RowTwo',
      }

      const response = await testAdapter.request(request)

      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error for unrecognised file path prefix', async () => {
      const request = {
        endpoint: 'csv',
        bucket: 's3-bucket',
        keyPrefix: 'incorrect/path/file',
        headerRow: 2,
        resultColumn: 'Value',
        matcherColumn: 'Name',
        matcherValue: 'RowTwo',
      }

      const response = await testAdapter.request(request)

      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error for unrecognised bucket', async () => {
      const request = {
        endpoint: 'csv',
        bucket: 'incorrect-s3-bucket',
        keyPrefix: 'correct/path/file',
        headerRow: 2,
        resultColumn: 'Value',
        matcherColumn: 'Name',
        matcherValue: 'RowTwo',
      }

      const response = await testAdapter.request(request)

      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error for invalid result column', async () => {
      const request = {
        endpoint: 'csv',
        bucket: 's3-bucket',
        keyPrefix: 'correct/path/file',
        headerRow: 2,
        resultColumn: 'Invalid',
        matcherColumn: 'Name',
        matcherValue: 'RowTwo',
      }

      const response = await testAdapter.request(request)

      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error for invalid matcher column', async () => {
      const request = {
        endpoint: 'csv',
        bucket: 's3-bucket',
        keyPrefix: 'correct/path/file',
        headerRow: 2,
        resultColumn: 'Value',
        matcherColumn: 'Invalid',
        matcherValue: 'RowTwo',
      }

      const response = await testAdapter.request(request)

      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error for invalid matcher value', async () => {
      const request = {
        endpoint: 'csv',
        bucket: 's3-bucket',
        keyPrefix: 'correct/path/file',
        headerRow: 2,
        resultColumn: 'Value',
        matcherColumn: 'Name',
        matcherValue: 'Invalid',
      }

      const response = await testAdapter.request(request)

      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error for invalid CSV file', async () => {
      const request = {
        endpoint: 'csv',
        bucket: 's3-bucket',
        keyPrefix: 'correct/path/invalid',
        headerRow: 2,
        resultColumn: 'Value',
        matcherColumn: 'Name',
        matcherValue: 'RowTwo',
      }

      const response = await testAdapter.request(request)

      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error for empty CSV file', async () => {
      const request = {
        endpoint: 'csv',
        bucket: 's3-bucket',
        keyPrefix: 'correct/path/empty',
        headerRow: 2,
        resultColumn: 'Value',
        matcherColumn: 'Name',
        matcherValue: 'RowTwo',
      }

      const response = await testAdapter.request(request)

      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success for CSV with single header', async () => {
      const request = {
        endpoint: 'csv',
        bucket: 's3-bucket',
        keyPrefix: 'correct/path/single-header',
        headerRow: 1,
        resultColumn: 'Value',
        matcherColumn: 'Name',
        matcherValue: 'RowTwo',
      }

      const response = await testAdapter.request(request)

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error if multiple matching rows are found', async () => {
      const request = {
        endpoint: 'csv',
        bucket: 's3-bucket',
        keyPrefix: 'correct/path/multiple-matches',
        headerRow: 2,
        resultColumn: 'Value',
        matcherColumn: 'Name',
        matcherValue: 'RowOne',
      }

      const response = await testAdapter.request(request)

      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
