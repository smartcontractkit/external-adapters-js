const { assert } = require('chai')
const { assertSuccess, assertError } = require('@chainlink/external-adapter')
const { execute } = require('../adapter')

describe('execute', () => {
  const jobID = '1'

  context('successful calls @integration', () => {
    const requests = [
      { name: 'id not supplied', testData: { data: { base: 'FTSE' } } },
      { name: 'base', testData: { id: jobID, data: { base: 'N225' } } },
      { name: 'from', testData: { id: jobID, data: { from: 'N225' } } },
      { name: 'asset', testData: { id: jobID, data: { asset: 'N225' } } },
      { name: 'AUD', testData: { id: jobID, data: { asset: 'AUD' } } },
      { name: 'CHF', testData: { id: jobID, data: { asset: 'CHF' } } },
      { name: 'EUR', testData: { id: jobID, data: { asset: 'EUR' } } },
      { name: 'GBP', testData: { id: jobID, data: { asset: 'GBP' } } },
      { name: 'JPY', testData: { id: jobID, data: { asset: 'JPY' } } },
      { name: 'XAU', testData: { id: jobID, data: { asset: 'XAU' } } },
      { name: 'XAG', testData: { id: jobID, data: { asset: 'XAG' } } },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, (done) => {
        execute(req.testData, (statusCode, data) => {
          assertSuccess({ expected: 200, actual: statusCode }, data, jobID)
          assert.isAbove(Number(data.result), 0)
          assert.isAbove(Number(data.data.result), 0)
          done()
        })
      })
    })
  })

  context('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
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
        testData: { id: jobID, data: { base: 'not_real' } },
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
