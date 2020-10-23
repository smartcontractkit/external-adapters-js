const { assert } = require('chai')
const { assertSuccess, assertError } = require('@chainlink/external-adapter')
const { execute } = require('../adapter')

describe('execute', () => {
  const jobID = '1'

  context('successful calls @integration', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: { data: { market: 'BTC' } },
      },
      {
        name: 'id is supplied',
        testData: { id: jobID, data: { market: 'BTC' } },
      },
      {
        name: 'to',
        testData: { id: jobID, data: { to: 'BTC' } },
      },
      {
        name: 'quote',
        testData: { id: jobID, data: { quote: 'BTC' } },
      },
      {
        name: 'global marketcap',
        testData: { id: jobID, data: { endpoint: 'globalmarketcap', quote: 'USD' } },
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
      {
        name: 'market not supplied',
        testData: { id: jobID, data: {} },
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
        name: 'unknown market',
        testData: { id: jobID, data: { market: 'not_real' } },
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
