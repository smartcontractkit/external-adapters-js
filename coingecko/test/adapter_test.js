const { assert } = require('chai')
const { assertSuccess, assertError } = require('@chainlink/external-adapter')
const { execute } = require('../adapter')

describe('execute', () => {
  const jobID = '1'

  context('successful calls @integration', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: { data: { base: 'ETH', quote: 'USD' } },
      },
      {
        name: 'base/quote',
        testData: { id: jobID, data: { base: 'ETH', quote: 'USD' } },
      },
      {
        name: 'from/to',
        testData: { id: jobID, data: { from: 'ETH', to: 'USD' } },
      },
      {
        name: 'coin/market',
        testData: { id: jobID, data: { coin: 'ETH', market: 'USD' } },
      },
      {
        name: 'with coinid',
        testData: {
          id: jobID,
          data: { coin: 'ETH', market: 'USD', coinid: 'ethereum' },
        },
      },
      {
        name: 'global market cap',
        testData: {
          id: jobID,
          data: { endpoint: 'globalMarketCap', market: 'BTC' },
        },
      },
      {
        name: 'market dominance',
        testData: {
          id: jobID,
          data: { endpoint: 'dominance', quote: 'BTC' },
        },
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
        name: 'base not supplied',
        testData: { id: jobID, data: { quote: 'USD' } },
      },
      {
        name: 'quote not supplied',
        testData: { id: jobID, data: { base: 'ETH' } },
      },
      {
        name: 'market cap: market not supplied',
        testData: {
          id: jobID,
          data: { endpoint: 'globalMarketCap' },
        },
      },
      {
        name: 'market dominance: market not supplied',
        testData: {
          id: jobID,
          data: { endpoint: 'dominance' },
        },
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
        name: 'unknown base',
        testData: { id: jobID, data: { base: 'not_real', quote: 'USD' } },
      },
      {
        name: 'unknown quote',
        testData: { id: jobID, data: { base: 'ETH', quote: 'not_real' } },
      },
      {
        name: 'market cap: unknown market',
        testData: {
          id: jobID,
          data: { endpoint: 'globalMarketCap', market: 'not_real' },
        },
      },
      {
        name: 'market dominance: unknown market',
        testData: {
          id: jobID,
          data: { endpoint: 'dominance', market: 'not_real' },
        },
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
