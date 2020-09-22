const assert = require('chai').assert
const createRequest = require('../adapter').createRequest

describe('createRequest', () => {
  const jobID = '1'

  context('successful calls @integration', () => {
    it('id not supplied and data is not supplied', (done) => {
      createRequest({
        data: {
          endpoint: 'symbol',
          pair: 'btc-usd'
        }
      }, (statusCode, data) => {
        assert.equal(statusCode, 200)
        assert.equal(data.jobRunID, jobID)
        assert.isNotEmpty(data.data)
        assert.isAbove(Number(data.data.result), 0)
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

  context('error calls', () => {
    it('wrong symbol', (done) => {
      createRequest({
        data: {
          symbol: 'not-existing'
        }
      }, (statusCode, data) => {
        assert.equal(statusCode, 400)
        assert.equal(data.jobRunID, jobID)
        assert.equal(data.status, 'errored')
        assert.isNotEmpty(data.error)
        done()
      })
    })
  })
})
