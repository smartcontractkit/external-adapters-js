import { AdapterBatchResponse, Requester } from '../../src'
import {
  Server,
  SUCCESS_JSON_RESPONSE,
  SUCCESS_ARRAY_RESPONSE,
  SUCCESS_BATCHLIKE_RESPONSE,
  ERROR_CUSTOM_RESPONSE,
} from '../helpers/server'
import { AxiosRequestConfig, AxiosResponse } from 'axios'

describe('HTTP', () => {
  const server = new Server()

  const errorMessage = 'Request failed with status code 500'

  const baseOptions = {
    baseURL: server.getBaseURL(),
    timeout: 100,
    url: '',
  }
  const customError = (data: typeof ERROR_CUSTOM_RESPONSE) => {
    return data.result !== 'success'
  }

  beforeAll(() => {
    server.start()
  })
  afterEach(() => {
    server.reset()
    expect(server.errorCount).toEqual(0)
  })
  afterAll(() => {
    server.stop()
  })

  describe('Requester.request', () => {
    it('returns an error from an endpoint', async () => {
      const options = { ...baseOptions, url: '/error' }
      try {
        await Requester.request(options, undefined, 1, 0)
        expect(false).toBe(true)
      } catch (error: any) {
        expect(server.errorCount).toEqual(1)
        expect(error.message).toEqual(errorMessage)
      }
    })

    it('accepts custom retry amounts', async () => {
      const options = { ...baseOptions, url: '/error' }
      try {
        await Requester.request(options, undefined, 9, 0)
        expect(false).toBe(true)
      } catch (error: any) {
        expect(server.errorCount).toEqual(9)
        expect(error.message).toEqual(errorMessage)
      }
    })

    it('retries errored statuses', async () => {
      const options = { ...baseOptions, url: '/errorsTwice' }
      const { data } = await Requester.request<typeof SUCCESS_JSON_RESPONSE>(
        options,
        undefined,
        3,
        0,
      )
      expect(server.errorCount).toEqual(2)
      expect(data.result).toEqual('success')
      expect(data.value).toEqual(1)
    })

    it('only attempts once when retries is <1', async () => {
      const options = { ...baseOptions, url: '/error' }
      try {
        await Requester.request(options, undefined, 0, 0)
        expect(false).toBe(true)
      } catch (error: any) {
        expect(server.errorCount).toEqual(1)
      }
    })

    it('retries custom errors', async () => {
      const options = { ...baseOptions, url: '/customError' }
      try {
        await Requester.request(options, customError, 3, 0)
        expect(false).toBe(true)
      } catch (error: any) {
        const errorResponse: AxiosResponse<typeof ERROR_CUSTOM_RESPONSE> = {
          ...(error as AxiosResponse),
          data: ERROR_CUSTOM_RESPONSE,
        }
        expect(server.errorCount).toEqual(3)
        expect(error.message).toEqual(
          Requester.generateErrorMessage(options, errorResponse, undefined, true),
        )
      }
    })

    it('error message contains request info', async () => {
      const options: AxiosRequestConfig = {
        ...baseOptions,
        url: '/customError',
        params: { a: '123', b: '456' },
        data: {
          c: '789',
          d: '101',
        },
      }
      try {
        await Requester.request(options, customError, 1, 0)
        expect(false).toBe(true)
      } catch (error: any) {
        expect(server.errorCount).toEqual(1)
        expect(error.message).toContain(options.baseURL)
        expect(error.message).toContain(options.url)
        expect(error.message).toContain(JSON.stringify(options.data))
        expect(error.message).toContain(JSON.stringify(options.params))
      }
    })

    it('customError message is included when customError returns string', async () => {
      const options = { ...baseOptions, url: '/customError' }
      const customErrorString = () => {
        return 'This is a custom error string'
      }
      try {
        await Requester.request(options, customErrorString, 1, 0)
        expect(false).toBe(true)
      } catch (error: any) {
        expect(server.errorCount).toEqual(1)
        expect(error.message).toContain(customErrorString())
      }
    })

    it('returns the result from an endpoint', async () => {
      const options = { ...baseOptions, url: '/successJSON' }
      const { data } = await Requester.request<typeof SUCCESS_JSON_RESPONSE>(options)
      expect(server.errorCount).toEqual(0)
      expect(data.result).toEqual('success')
      expect(data.value).toEqual(1)
    })

    it('accepts optional customError param', async () => {
      const options = { ...baseOptions, url: '/successJSON' }
      const { data } = await Requester.request(options, customError)
      expect(server.errorCount).toEqual(0)
      expect(data.result).toEqual('success')
      expect(data.value).toEqual(1)
    })

    it('accepts optional retries param with customError', async () => {
      const options = { ...baseOptions, url: '/successJSON' }
      const { data } = await Requester.request(options, customError, 1)
      expect(server.errorCount).toEqual(0)
      expect(data.result).toEqual('success')
      expect(data.value).toEqual(1)
    })

    it('accepts optional retries param without customError', async () => {
      const options = { ...baseOptions, url: '/successJSON' }
      const { data } = await Requester.request<typeof SUCCESS_JSON_RESPONSE>(options, undefined, 1)
      expect(server.errorCount).toEqual(0)
      expect(data.result).toEqual('success')
      expect(data.value).toEqual(1)
    })

    it('accepts optional delay param with customError', async () => {
      const options = { ...baseOptions, url: '/successJSON' }
      const { data } = await Requester.request<typeof ERROR_CUSTOM_RESPONSE>(
        options,
        customError,
        1,
        0,
      )
      expect(server.errorCount).toEqual(0)
      expect(data.result).toEqual('success')
      expect(data.value).toEqual(1)
    })

    it('accepts optional delay param without customError', async () => {
      const options = { ...baseOptions, url: '/successJSON' }
      const { data } = await Requester.request<typeof SUCCESS_JSON_RESPONSE>(
        options,
        undefined,
        1,
        0,
      )
      expect(server.errorCount).toEqual(0)
      expect(data.result).toEqual('success')
      expect(data.value).toEqual(1)
    })
  })

  describe('Requester.validateResultNumber', () => {
    it('returns the desired value', async () => {
      const options = { ...baseOptions, url: '/successJSON' }
      const { data } = await Requester.request<typeof SUCCESS_JSON_RESPONSE>(
        options,
        undefined,
        1,
        0,
      )
      expect(server.errorCount).toEqual(0)
      expect(data.result).toEqual('success')
      expect(data.value).toEqual(1)
      const result = Requester.validateResultNumber(data, ['value'])
      expect(result).toEqual(1)
    })

    it('errors if the value is not a number', async () => {
      const options = { ...baseOptions, url: '/successJSON' }
      const { data } = await Requester.request<typeof SUCCESS_JSON_RESPONSE>(
        options,
        undefined,
        1,
        0,
      )
      expect(server.errorCount).toEqual(0)
      expect(data.result).toEqual('success')
      expect(data.value).toEqual(1)
      try {
        Requester.validateResultNumber(data, ['result'])
        expect(false).toBe(true)
      } catch (error: any) {
        expect(error.message).toEqual(
          'Invalid result received. This is likely an issue with the data provider or the input params/overrides.',
        )
      }
    })
  })

  describe('Requester.getResult', () => {
    it('returns the desired value', async () => {
      const options = { ...baseOptions, url: '/successJSON' }
      const { data } = await Requester.request<typeof SUCCESS_JSON_RESPONSE>(
        options,
        undefined,
        1,
        0,
      )
      expect(server.errorCount).toEqual(0)
      expect(data.result).toEqual('success')
      expect(data.value).toEqual(1)
      const result = Requester.getResult(data, ['value'])
      expect(result).toEqual(1)
    })

    it('does not error if the value is not a number', async () => {
      const options = { ...baseOptions, url: '/successJSON' }
      const { data } = await Requester.request<typeof SUCCESS_JSON_RESPONSE>(
        options,
        undefined,
        1,
        0,
      )
      expect(server.errorCount).toEqual(0)
      expect(data.result).toEqual('success')
      expect(data.value).toEqual(1)
      const result = Requester.getResult(data, ['result'])
      expect(result).toEqual('success')
    })

    it('returns undefined if the input is not data', async () => {
      const options = { ...baseOptions, url: '/successJSON' }
      const response = await Requester.request<typeof SUCCESS_JSON_RESPONSE>(
        options,
        undefined,
        1,
        0,
      )
      expect(server.errorCount).toEqual(0)
      expect(response.data.result).toEqual('success')
      expect(response.data.value).toEqual(1)
      const result = Requester.getResult(response, ['result'])
      expect(typeof result).toEqual('undefined')
    })
  })

  describe('Requester.errored', () => {
    it('returns a Chainlink error when no params are supplied', () => {
      const error = Requester.errored()
      expect(error.jobRunID).toEqual('1')
      expect(error.status).toEqual('errored')
      expect(error.error.message).toEqual('An error occurred.')
    })

    it('returns a Chainlink error when no data is supplied', () => {
      const error = Requester.errored('abc123')
      expect(error.jobRunID).toEqual('abc123')
      expect(error.status).toEqual('errored')
      expect(error.error.message).toEqual('An error occurred.')
    })
  })

  describe('Requester.success', () => {
    it('returns a Chainlink result', async () => {
      const options = { ...baseOptions, url: '/successJSON' }
      const response = await Requester.request(options, undefined, 1, 0)
      const result = Requester.success('1', response)
      expect(result.jobRunID).toEqual('1')
      expect(result.result).toEqual('success')
      expect(result.data.result).toEqual('success')
      expect(result.statusCode).toEqual(200)
    })
  })

  describe('Requester.withResult', () => {
    it('Adds a single result from JSON response', async () => {
      const options = { ...baseOptions, url: '/successJSON' }
      const response = await Requester.request<typeof SUCCESS_JSON_RESPONSE>(options)
      const result = Requester.validateResultNumber(response.data, ['value'])
      const withResult = Requester.withResult(response, result)
      expect(withResult.data.result).toEqual(1)
    })
    it('Adds a single result from Array response', async () => {
      const options = { ...baseOptions, url: '/successArray' }
      const response = await Requester.request<typeof SUCCESS_ARRAY_RESPONSE>(options)
      const result = Requester.validateResultNumber(response.data, [0])
      const withResult = Requester.withResult(response, result)
      expect(withResult.data.result).toEqual(1)
      expect(withResult.data.payload).toEqual(SUCCESS_ARRAY_RESPONSE)
    })
    it('Adds results', async () => {
      const options = { ...baseOptions, url: '/successBatchlike' }
      const response = await Requester.request<typeof SUCCESS_BATCHLIKE_RESPONSE>(options)
      const results: AdapterBatchResponse = response.data.value.map((v) => [
        'somekey',
        { id: '1', data: {} },
        Requester.validateResultNumber(v),
      ])
      const withResult = Requester.withResult(response, undefined, results)
      expect(withResult.data.results).toEqual(results)
    })
  })
})
