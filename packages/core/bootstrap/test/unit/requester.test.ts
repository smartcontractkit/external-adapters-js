import { BatchedResultT } from '../../src/types'
import { Requester } from '../../src/lib/modules/requester'
import {
  Server,
  SUCCESS_JSON_RESPONSE,
  SUCCESS_ARRAY_RESPONSE,
  SUCCESS_BATCHLIKE_RESPONSE,
  ERROR_CUSTOM_RESPONSE,
} from '../helpers/server'

describe('HTTP', () => {
  const errorMessage = 'Request failed with status code 500'
  const customErrorMessage = 'Could not retrieve valid data: {"result":"error","value":1}'
  const baseOptions = {
    timeout: 100,
    url: '',
  }
  const customError = (data: typeof ERROR_CUSTOM_RESPONSE) => {
    return data.result !== 'success'
  }

  const server = new Server()

  beforeAll(() => {
    server.start()
  })

  beforeEach(() => {
    server.reset()
    expect(server.errorCount).toEqual(0)
  })

  describe('Requester.request', () => {
    it('returns an error from an endpoint', async () => {
      const options = { ...baseOptions, url: server.getURL('error') }
      try {
        await Requester.request(options, null, 1, 0)
        expect(false).toBe(true)
      } catch (error) {
        expect(server.errorCount).toEqual(1)
        expect(error.message).toEqual(errorMessage)
      }
    })

    it('accepts custom retry amounts', async () => {
      const options = { ...baseOptions, url: server.getURL('error') }
      try {
        await Requester.request(options, null, 9, 0)
        expect(false).toBe(true)
      } catch (error) {
        expect(server.errorCount).toEqual(9)
        expect(error.message).toEqual(errorMessage)
      }
    })

    it('retries errored statuses', async () => {
      const options = { ...baseOptions, url: server.getURL('errorsTwice') }
      const { data } = await Requester.request<typeof SUCCESS_JSON_RESPONSE>(options, null, 3, 0)
      expect(server.errorCount).toEqual(2)
      expect(data.result).toEqual('success')
      expect(data.value).toEqual(1)
    })

    it('retries custom errors', async () => {
      const options = { ...baseOptions, url: server.getURL('customError') }
      try {
        await Requester.request(options, customError, 3, 0)
        expect(false).toBe(true)
      } catch (error) {
        expect(server.errorCount).toEqual(3)
        expect(error.message).toEqual(customErrorMessage)
      }
    })

    it('returns the result from an endpoint', async () => {
      const options = { ...baseOptions, url: server.getURL('successJSON') }
      const { data } = await Requester.request<typeof SUCCESS_JSON_RESPONSE>(options)
      expect(server.errorCount).toEqual(0)
      expect(data.result).toEqual('success')
      expect(data.value).toEqual(1)
    })

    it('accepts optional customError param', async () => {
      const options = { ...baseOptions, url: server.getURL('successJSON') }
      const { data } = await Requester.request(options, customError)
      expect(server.errorCount).toEqual(0)
      expect(data.result).toEqual('success')
      expect(data.value).toEqual(1)
    })

    it('accepts optional retries param with customError', async () => {
      const options = { ...baseOptions, url: server.getURL('successJSON') }
      const { data } = await Requester.request(options, customError, 1)
      expect(server.errorCount).toEqual(0)
      expect(data.result).toEqual('success')
      expect(data.value).toEqual(1)
    })

    it('accepts optional retries param without customError', async () => {
      const options = { ...baseOptions, url: server.getURL('successJSON') }
      const { data } = await Requester.request<typeof SUCCESS_JSON_RESPONSE>(options, null, 1)
      expect(server.errorCount).toEqual(0)
      expect(data.result).toEqual('success')
      expect(data.value).toEqual(1)
    })

    it('accepts optional delay param with customError', async () => {
      const options = { ...baseOptions, url: server.getURL('successJSON') }
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
      const options = { ...baseOptions, url: server.getURL('successJSON') }
      const { data } = await Requester.request<typeof SUCCESS_JSON_RESPONSE>(options, null, 1, 0)
      expect(server.errorCount).toEqual(0)
      expect(data.result).toEqual('success')
      expect(data.value).toEqual(1)
    })
  })

  describe('Requester.validateResultNumber', () => {
    it('returns the desired value', async () => {
      const options = { ...baseOptions, url: server.getURL('successJSON') }
      const { data } = await Requester.request<typeof SUCCESS_JSON_RESPONSE>(options, null, 1, 0)
      expect(server.errorCount).toEqual(0)
      expect(data.result).toEqual('success')
      expect(data.value).toEqual(1)
      const result = Requester.validateResultNumber(data, ['value'])
      expect(result).toEqual(1)
    })

    it('errors if the value is not a number', async () => {
      const options = { ...baseOptions, url: server.getURL('successJSON') }
      const { data } = await Requester.request<typeof SUCCESS_JSON_RESPONSE>(options, null, 1, 0)
      expect(server.errorCount).toEqual(0)
      expect(data.result).toEqual('success')
      expect(data.value).toEqual(1)
      try {
        Requester.validateResultNumber(data, ['result'])
        expect(false).toBe(true)
      } catch (error) {
        expect(error.message).toEqual('Invalid result received')
      }
    })
  })

  describe('Requester.getResult', () => {
    it('returns the desired value', async () => {
      const options = { ...baseOptions, url: server.getURL('successJSON') }
      const { data } = await Requester.request<typeof SUCCESS_JSON_RESPONSE>(options, null, 1, 0)
      expect(server.errorCount).toEqual(0)
      expect(data.result).toEqual('success')
      expect(data.value).toEqual(1)
      const result = Requester.getResult(data, ['value'])
      expect(result).toEqual(1)
    })

    it('does not error if the value is not a number', async () => {
      const options = { ...baseOptions, url: server.getURL('successJSON') }
      const { data } = await Requester.request<typeof SUCCESS_JSON_RESPONSE>(options, null, 1, 0)
      expect(server.errorCount).toEqual(0)
      expect(data.result).toEqual('success')
      expect(data.value).toEqual(1)
      const result = Requester.getResult(data, ['result'])
      expect(result).toEqual('success')
    })

    it('returns undefined if the input is not data', async () => {
      const options = { ...baseOptions, url: server.getURL('successJSON') }
      const response = await Requester.request<typeof SUCCESS_JSON_RESPONSE>(options, null, 1, 0)
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
      const options = { ...baseOptions, url: server.getURL('successJSON') }
      const response = await Requester.request(options, null, 1, 0)
      const result = Requester.success('1', response)
      expect(result.jobRunID).toEqual('1')
      expect(result.result).toEqual('success')
      expect(result.data.result).toEqual('success')
      expect(result.statusCode).toEqual(200)
    })
  })

  describe('Requester.withResult', () => {
    it('Adds a single result from JSON response', async () => {
      const options = { ...baseOptions, url: server.getURL('successJSON') }
      const response = await Requester.request<typeof SUCCESS_JSON_RESPONSE>(options)
      const result = Requester.validateResultNumber(response.data, ['value'])
      const withResult = Requester.withResult(response, result)
      expect(withResult.data.result).toEqual(1)
    })
    it('Adds a single result from Array response', async () => {
      const options = { ...baseOptions, url: server.getURL('successArray') }
      const response = await Requester.request<typeof SUCCESS_ARRAY_RESPONSE>(options)
      const result = Requester.validateResultNumber(response.data, [0])
      const withResult = Requester.withResult(response, result)
      expect(withResult.data.result).toEqual(1)
      expect(withResult.data).toEqual(SUCCESS_ARRAY_RESPONSE)
    })
    it('Adds results', async () => {
      const options = { ...baseOptions, url: server.getURL('successBatchlike') }
      const response = await Requester.request<typeof SUCCESS_BATCHLIKE_RESPONSE>(options)
      const results: BatchedResultT = response.data.value.map((v) => [
        { id: '1', data: {} },
        Requester.validateResultNumber(v),
      ])
      const withResult = Requester.withResult(response, undefined, results)
      expect(withResult.data.results).toEqual(results)
    })
  })

  afterAll((done) => {
    server.stop(done)
  })
})
