const assert = require('chai').assert
const createRequest = require('../adapter').createRequest

describe('createRequest', () => {
  const jobID = '1'

  context('successful calls', () => {
    it('id not supplied and data is not supplied', (done) => {
      createRequest({
        data: {}
      }, (statusCode, data) => {
        assert.equal(statusCode, 200)
        assert.equal(data.jobRunID, jobID)
        assert.isNotEmpty(data.data)
        assert.isAbove(Number(data.result.volume), 0)
        assert.isAbove(Number(data.result.vwap), 0)
        assert.isAbove(Number(data.data.result.volume), 0)
        assert.isAbove(Number(data.data.result.vwap), 0)
        done()
      })
    })

    it('debug is true', (done) => {
      createRequest({
        data: {
          debug: true
        }
      }, (statusCode, data) => {
        assert.equal(statusCode, 200)
        assert.equal(data.jobRunID, jobID)
        assert.isNotEmpty(data.data)
        assert.isAbove(Number(data.result.volume), 0)
        assert.isNotEmpty(data.data.raw)
        done()
      })
    })
  })

  context('error calls', () => {
    it('empty body', (done) => {
      createRequest({}, (statusCode, data) => {
        assert.equal(statusCode, 500)
        assert.equal(data.jobRunID, jobID)
        assert.equal(data.status, 'errored')
        assert.isNotEmpty(data.error)
        done()
      })
    })
  })
})
