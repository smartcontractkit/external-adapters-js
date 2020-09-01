const assert = require('chai').assert
const createRequest = require('../adapter').createRequest

describe('createRequest', () => {
  const jobID = '1'

  context('successful calls', () => {
    const requests = [
      { name: 'id not supplied', testData: { data: { symbol: 'ETH', result: 'oneDayIv' } } },
      { name: '1 day', testData: { id: jobID, data: { symbol: 'ETH', result: 'oneDayIv' } } },
      { name: '2 days', testData: { id: jobID, data: { symbol: 'ETH', result: 'twoDayIv' } } },
      { name: '1 week', testData: { id: jobID, data: { symbol: 'ETH', result: 'sevenDayIv' } } },
      { name: '2 weeks', testData: { id: jobID, data: { symbol: 'ETH', result: 'fourteenDayIv' } } },
      { name: '3 weeks', testData: { id: jobID, data: { symbol: 'ETH', result: 'twentyOneDayIv' } } },
      { name: '4 weeks', testData: { id: jobID, data: { symbol: 'ETH', result: 'twentyEightDayIv' } } },
      { name: '1 day BTC', testData: { id: jobID, data: { symbol: 'BTC', result: 'oneDayIv' } } }
    ]

    requests.forEach(req => {
      it(`${req.name}`, (done) => {
        createRequest(req.testData, (statusCode, data) => {
          assert.equal(statusCode, 200)
          assert.equal(data.jobRunID, jobID)
          assert.isNotEmpty(data.data)
          assert.isAbove(data.result, 0)
          assert.isAbove(data.data.result, 0)
          done()
        })
      })
    })
  })

  context('error calls', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      { name: 'symbol not supplied', testData: { id: jobID, data: { result: 'oneDayIv' } } },
      { name: 'result not supplied', testData: { id: jobID, data: { symbol: 'ETH' } } },
      { name: 'unknown symbol', testData: { id: jobID, data: { base: 'not_real', result: 'oneDayIv' } } },
      { name: 'unknown result', testData: { id: jobID, data: { symbol: 'ETH', result: 'not_real' } } }
    ]

    requests.forEach(req => {
      it(`${req.name}`, (done) => {
        createRequest(req.testData, (statusCode, data) => {
          assert.equal(statusCode, 500)
          assert.equal(data.jobRunID, jobID)
          assert.equal(data.status, 'errored')
          assert.isNotEmpty(data.error)
          done()
        })
      })
    })
  })
})
