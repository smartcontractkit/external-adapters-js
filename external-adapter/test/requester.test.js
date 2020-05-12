const { assert } = require('chai')
const { Requester } = require('../src/requester')
const { Server } = require('./helpers/server')

describe('Requester', () => {
  const errorMessage = 'Request failed with status code 500'
  const customErrorMessage = 'Could not retrieve valid data: {"result":"error","value":1}'
  const successUrl = 'http://localhost:18080'
  const errorUrl = 'http://localhost:18080/error'
  const errorTwiceUrl = 'http://localhost:18080/errorsTwice'
  const customErrorUrl = 'http://localhost:18080/customError'
  const options = {
    timeout: 100
  }
  const customError = (data) => {
    return data.result !== 'success'
  }

  const server = new Server()

  before(() => {
    server.start()
  })

  beforeEach(() => {
    server.reset()
    assert.equal(server.errorCount, 0)
  })

  describe('Requester.request', () => {
    it('returns an error from an endpoint', async () => {
      options.url = errorUrl
      try {
        await Requester.request(options, 1, 0)
        assert.fail('expected error')
      } catch (error) {
        assert.equal(server.errorCount, 1)
        assert.equal(error.message, errorMessage)
      }
    })

    it('accepts custom retry amounts', async () => {
      options.url = errorUrl
      try {
        await Requester.request(options, 9, 0)
        assert.fail('expected error')
      } catch (error) {
        assert.equal(server.errorCount, 9)
        assert.equal(error.message, errorMessage)
      }
    })

    it('retries errored statuses', async () => {
      options.url = errorTwiceUrl
      const { data } = await Requester.request(options, 3, 0)
      assert.equal(server.errorCount, 2)
      assert.equal(data.result, 'success')
      assert.equal(data.value, 1)
    })

    it('retries custom errors', async () => {
      options.url = customErrorUrl
      try {
        await Requester.request(options, customError, 3, 0)
        assert.fail('expected error')
      } catch (error) {
        assert.equal(server.errorCount, 3)
        assert.equal(error.message, customErrorMessage)
      }
    })

    it('returns the result from an endpoint', async () => {
      options.url = successUrl
      const { data } = await Requester.request(options)
      assert.equal(server.errorCount, 0)
      assert.equal(data.result, 'success')
      assert.equal(data.value, 1)
    })

    it('accepts optional customError param', async () => {
      options.url = successUrl
      const { data } = await Requester.request(options, customError)
      assert.equal(server.errorCount, 0)
      assert.equal(data.result, 'success')
      assert.equal(data.value, 1)
    })

    it('accepts optional retries param with customError', async () => {
      options.url = successUrl
      const { data } = await Requester.request(options, customError, 1)
      assert.equal(server.errorCount, 0)
      assert.equal(data.result, 'success')
      assert.equal(data.value, 1)
    })

    it('accepts optional retries param without customError', async () => {
      options.url = successUrl
      const { data } = await Requester.request(options, 1)
      assert.equal(server.errorCount, 0)
      assert.equal(data.result, 'success')
      assert.equal(data.value, 1)
    })

    it('accepts optional delay param with customError', async () => {
      options.url = successUrl
      const { data } = await Requester.request(options, customError, 1, 0)
      assert.equal(server.errorCount, 0)
      assert.equal(data.result, 'success')
      assert.equal(data.value, 1)
    })

    it('accepts optional delay param without customError', async () => {
      options.url = successUrl
      const { data } = await Requester.request(options, 1, 0)
      assert.equal(server.errorCount, 0)
      assert.equal(data.result, 'success')
      assert.equal(data.value, 1)
    })
  })

  describe('Requester.validateResultNumber', () => {
    it('returns the desired value', async () => {
      options.url = successUrl
      const { data } = await Requester.request(options, 1, 0)
      assert.equal(server.errorCount, 0)
      assert.equal(data.result, 'success')
      assert.equal(data.value, 1)
      const result = Requester.validateResultNumber(data, ['value'])
      assert.equal(result, 1)
    })

    it('errors if the value is not a number', async () => {
      options.url = successUrl
      const { data } = await Requester.request(options, 1, 0)
      assert.equal(server.errorCount, 0)
      assert.equal(data.result, 'success')
      assert.equal(data.value, 1)
      try {
        Requester.validateResultNumber(data, ['result'])
        assert.fail('expected error')
      } catch (error) {
        assert.equal(error.message, 'Invalid result')
      }
    })
  })

  describe('Requester.getResult', () => {
    it('returns the desired value', async () => {
      options.url = successUrl
      const { data } = await Requester.request(options, 1, 0)
      assert.equal(server.errorCount, 0)
      assert.equal(data.result, 'success')
      assert.equal(data.value, 1)
      const result = Requester.getResult(data, ['value'])
      assert.equal(result, 1)
    })

    it('does not error if the value is not a number', async () => {
      options.url = successUrl
      const { data } = await Requester.request(options, 1, 0)
      assert.equal(server.errorCount, 0)
      assert.equal(data.result, 'success')
      assert.equal(data.value, 1)
      const result = Requester.getResult(data, ['result'])
      assert.equal(result, 'success')
    })

    it('returns undefined if the input is not data', async () => {
      options.url = successUrl
      const response = await Requester.request(options, 1, 0)
      assert.equal(server.errorCount, 0)
      assert.equal(response.data.result, 'success')
      assert.equal(response.data.value, 1)
      const result = Requester.getResult(response, ['result'])
      assert.equal(typeof result, 'undefined')
    })
  })

  describe('Requester.errored', () => {
    it('returns a Chainlink error when no params are supplied', () => {
      const error = Requester.errored()
      assert.equal(error.jobRunID, '1')
      assert.equal(error.status, 'errored')
      assert.equal(error.error.message, 'An error occurred')
    })

    it('returns a Chainlink error when no data is supplied', () => {
      const error = Requester.errored('abc123')
      assert.equal(error.jobRunID, 'abc123')
      assert.equal(error.status, 'errored')
      assert.equal(error.error.message, 'An error occurred')
    })
  })

  describe('Requester.success', () => {
    it('returns a Chainlink result', async () => {
      options.url = successUrl
      const response = await Requester.request(options, 1, 0)
      const result = Requester.success('1', response)
      assert.equal(result.jobRunID, '1')
      assert.equal(result.result, 'success')
      assert.equal(result.data.result, 'success')
      assert.equal(result.statusCode, 200)
    })
  })

  after(() => {
    server.stop()
  })
})
