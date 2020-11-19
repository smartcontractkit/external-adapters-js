const { assert } = require('chai')
const { assertSuccess, assertError } = require('@chainlink/adapter-test-helpers')
const { execute } = require('../adapter')

describe('execute', () => {
  const expectedJobRunId = '10'

  context('successful calls @integration', () => {
    const requests = [
      {
        name: 'base/quote',
        testData: { id: expectedJobRunId, data: { base: 'ETH', quote: 'USD' } },
      },
      {
        name: 'from/to',
        testData: { id: expectedJobRunId, data: { from: 'ETH', to: 'USD' } },
      },
      {
        name: 'coin/market',
        testData: { id: expectedJobRunId, data: { coin: 'ETH', market: 'USD' } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, (done) => {
        execute(req.testData, (statusCode, data) => {
          assertSuccess({ expected: 200, actual: statusCode }, data, expectedJobRunId)
          assert.isAbove(data.result, 0)
          assert.isAbove(data.data.result, 0)
          done()
        })
      })
    })
  })

  context('validation error', () => {
    const requests = [
      { name: 'empty body', testData: { id: expectedJobRunId } },
      { name: 'empty data', testData: { id: expectedJobRunId, data: {} } },
      {
        name: 'base not supplied',
        testData: { id: expectedJobRunId, data: { quote: 'USD' } },
      },
      {
        name: 'quote not supplied',
        testData: { id: expectedJobRunId, data: { base: 'ETH' } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, (done) => {
        execute(req.testData, (statusCode, data) => {
          assertError({ expected: 400, actual: statusCode }, data, expectedJobRunId)
          done()
        })
      })
    })
  })

  context('error calls @integration', () => {
    const requests = [
      {
        name: 'unknown base',
        testData: { id: expectedJobRunId, data: { base: 'not_real', quote: 'USD' } },
      },
      {
        name: 'unknown quote',
        testData: { id: expectedJobRunId, data: { base: 'ETH', quote: 'not_real' } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, (done) => {
        execute(req.testData, (statusCode, data) => {
          assertError({ expected: 500, actual: statusCode }, data, expectedJobRunId)
          done()
        })
      })
    })
  })
})
