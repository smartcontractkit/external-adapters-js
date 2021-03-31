import { Requester } from '../src/lib/external-adapter/requester'
import { Server } from './helpers/server'

describe('Requester', () => {
  const errorMessage = 'Request failed with status code 500'
  const customErrorMessage = 'Could not retrieve valid data: {"result":"error","value":1}'
  const successUrl = 'http://localhost:18080'
  const errorUrl = 'http://localhost:18080/error'
  const errorTwiceUrl = 'http://localhost:18080/errorsTwice'
  const customErrorUrl = 'http://localhost:18080/customError'
  const options = {
    timeout: 100,
    url: '',
  }
  const customError = (data: { [key: string]: any }) => {
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
      options.url = errorUrl
      try {
        await Requester.request(options, 1, 0)
        expect(false).toBe(true)
      } catch (error) {
        expect(server.errorCount).toEqual(1)
        expect(error.message).toEqual(errorMessage)
      }
    })

    it('accepts custom retry amounts', async () => {
      options.url = errorUrl
      try {
        await Requester.request(options, 9, 0)
        expect(false).toBe(true)
      } catch (error) {
        expect(server.errorCount).toEqual(9)
        expect(error.message).toEqual(errorMessage)
      }
    })

    it('retries errored statuses', async () => {
      options.url = errorTwiceUrl
      const { data } = await Requester.request(options, 3, 0)
      expect(server.errorCount).toEqual(2)
      expect(data.result).toEqual('success')
      expect(data.value).toEqual(1)
    })

    it('retries custom errors', async () => {
      options.url = customErrorUrl
      try {
        await Requester.request(options, customError, 3, 0)
        expect(false).toBe(true)
      } catch (error) {
        expect(server.errorCount).toEqual(3)
        expect(error.message).toEqual(customErrorMessage)
      }
    })

    it('returns the result from an endpoint', async () => {
      options.url = successUrl
      const { data } = await Requester.request(options)
      expect(server.errorCount).toEqual(0)
      expect(data.result).toEqual('success')
      expect(data.value).toEqual(1)
    })

    it('accepts optional customError param', async () => {
      options.url = successUrl
      const { data } = await Requester.request(options, customError)
      expect(server.errorCount).toEqual(0)
      expect(data.result).toEqual('success')
      expect(data.value).toEqual(1)
    })

    it('accepts optional retries param with customError', async () => {
      options.url = successUrl
      const { data } = await Requester.request(options, customError, 1)
      expect(server.errorCount).toEqual(0)
      expect(data.result).toEqual('success')
      expect(data.value).toEqual(1)
    })

    it('accepts optional retries param without customError', async () => {
      options.url = successUrl
      const { data } = await Requester.request(options, 1)
      expect(server.errorCount).toEqual(0)
      expect(data.result).toEqual('success')
      expect(data.value).toEqual(1)
    })

    it('accepts optional delay param with customError', async () => {
      options.url = successUrl
      const { data } = await Requester.request(options, customError, 1, 0)
      expect(server.errorCount).toEqual(0)
      expect(data.result).toEqual('success')
      expect(data.value).toEqual(1)
    })

    it('accepts optional delay param without customError', async () => {
      options.url = successUrl
      const { data } = await Requester.request(options, 1, 0)
      expect(server.errorCount).toEqual(0)
      expect(data.result).toEqual('success')
      expect(data.value).toEqual(1)
    })
  })

  describe('Requester.validateResultNumber', () => {
    it('returns the desired value', async () => {
      options.url = successUrl
      const { data } = await Requester.request(options, 1, 0)
      expect(server.errorCount).toEqual(0)
      expect(data.result).toEqual('success')
      expect(data.value).toEqual(1)
      const result = Requester.validateResultNumber(data, ['value'])
      expect(result).toEqual(1)
    })

    it('errors if the value is not a number', async () => {
      options.url = successUrl
      const { data } = await Requester.request(options, 1, 0)
      expect(server.errorCount).toEqual(0)
      expect(data.result).toEqual('success')
      expect(data.value).toEqual(1)
      try {
        Requester.validateResultNumber(data, ['result'])
        expect(false).toBe(true)
      } catch (error) {
        expect(error.message).toEqual('Invalid result')
      }
    })
  })

  describe('Requester.getResult', () => {
    it('returns the desired value', async () => {
      options.url = successUrl
      const { data } = await Requester.request(options, 1, 0)
      expect(server.errorCount).toEqual(0)
      expect(data.result).toEqual('success')
      expect(data.value).toEqual(1)
      const result = Requester.getResult(data, ['value'])
      expect(result).toEqual(1)
    })

    it('does not error if the value is not a number', async () => {
      options.url = successUrl
      const { data } = await Requester.request(options, 1, 0)
      expect(server.errorCount).toEqual(0)
      expect(data.result).toEqual('success')
      expect(data.value).toEqual(1)
      const result = Requester.getResult(data, ['result'])
      expect(result).toEqual('success')
    })

    it('returns undefined if the input is not data', async () => {
      options.url = successUrl
      const response = await Requester.request(options, 1, 0)
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
      options.url = successUrl
      const response = await Requester.request(options, 1, 0)
      const result = Requester.success('1', response)
      expect(result.jobRunID).toEqual('1')
      expect(result.result).toEqual('success')
      expect(result.data.result).toEqual('success')
      expect(result.statusCode).toEqual(200)
    })
  })

  afterAll((done) => {
    server.stop(done)
  })
})
