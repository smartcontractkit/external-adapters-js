const { assert } = require('chai')
const { assertSuccess, assertError } = require('@chainlink/adapter-test-helpers')
const { execute } = require('../adapter')

describe('execute', () => {
  const jobID = '1'
  process.env.API_KEY = 'test_api_key'

  context('successful calls @integration', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: { data: { symbol: 'ETH', result: 'oneDayIv' } },
      },
      {
        name: '1 day',
        testData: { id: jobID, data: { symbol: 'ETH', result: 'oneDayIv' } },
      },
      {
        name: '2 days',
        testData: { id: jobID, data: { symbol: 'ETH', result: 'twoDayIv' } },
      },
      {
        name: '1 week',
        testData: { id: jobID, data: { symbol: 'ETH', result: 'sevenDayIv' } },
      },
      {
        name: '2 weeks',
        testData: {
          id: jobID,
          data: { symbol: 'ETH', result: 'fourteenDayIv' },
        },
      },
      {
        name: '3 weeks',
        testData: {
          id: jobID,
          data: { symbol: 'ETH', result: 'twentyOneDayIv' },
        },
      },
      {
        name: '4 weeks',
        testData: {
          id: jobID,
          data: { symbol: 'ETH', result: 'twentyEightDayIv' },
        },
      },
      {
        name: '1 day BTC',
        testData: { id: jobID, data: { symbol: 'BTC', result: 'oneDayIv' } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, (done) => {
        execute(req.testData, (statusCode, data) => {
          assertSuccess({ expected: 200, actual: statusCode }, data, jobID)
          assert.isAbove(data.result, 0)
          assert.isAbove(data.data.result, 0)
          done()
        })
      })
    })
  })

  context('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      {
        name: 'symbol not supplied',
        testData: { id: jobID, data: { result: 'oneDayIv' } },
      },
      {
        name: 'result not supplied',
        testData: { id: jobID, data: { symbol: 'ETH' } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, (done) => {
        execute(req.testData, (statusCode, data) => {
          assertError({ expected: 400, actual: statusCode }, data, jobID)
          done()
        })
      })
    })
  })

  context('error calls @integration', () => {
    const requests = [
      {
        name: 'unknown symbol',
        testData: { id: jobID, data: { base: 'not_real', result: 'oneDayIv' } },
      },
      {
        name: 'unknown result',
        testData: { id: jobID, data: { symbol: 'ETH', result: 'not_real' } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, (done) => {
        execute(req.testData, (statusCode, data) => {
          assertError({ expected: 500, actual: statusCode }, data, jobID)
          done()
        })
      })
    })
  })
})
