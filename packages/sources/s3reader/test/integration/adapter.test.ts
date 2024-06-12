import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import { GetObjectCommand } from '@aws-sdk/client-s3'

jest.mock('@aws-sdk/client-s3', () => {
  const originalModule = jest.requireActual('@aws-sdk/client-s3')
  return {
    ...originalModule,
    S3Client: jest.fn().mockImplementation(() => {
      return {
        send: jest.fn().mockImplementation(async (command: GetObjectCommand) => {
          if (command.input.Bucket == 's3_bucket' && command.input.Key == 'correct/path/file.csv') {
            return {
              Body: {
                transformToString: () =>
                  'Date,01/01/01,\nName,Value,Other\nRowOne,123,Other1\nRowTwo,456,Other2\nRowThree,789,Other3',
              },
            }
          } else {
            return {
              Body: undefined,
            }
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
        bucket: 's3_bucket',
        key: 'correct/path/file.csv',
        headerRow: 2,
        resultColumn: 'Value',
        matcherColumn: 'Name',
        matcherValue: 'RowTwo',
      }

      const response = await testAdapter.request(request)

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error for unrecognised file path', async () => {
      const request = {
        endpoint: 'csv',
        bucket: 's3_bucket',
        key: 'incorrect/path/file.csv',
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
        bucket: 's3_bucket',
        key: 'correct/path/file.csv',
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
        bucket: 's3_bucket',
        key: 'correct/path/file.csv',
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
        bucket: 's3_bucket',
        key: 'correct/path/file.csv',
        headerRow: 2,
        resultColumn: 'Value',
        matcherColumn: 'Name',
        matcherValue: 'Invalid',
      }

      const response = await testAdapter.request(request)

      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
