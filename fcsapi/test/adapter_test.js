const assert = require('chai').assert
const createRequest = require('../adapter').createRequest

describe('createRequest', () => {
  const jobID = '1'

  context('successful calls', () => {
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
      { name: 'XAG', testData: { id: jobID, data: { asset: 'XAG' } } }
    ]

    requests.forEach(req => {
      it(`${req.name}`, (done) => {
        createRequest(req.testData, (statusCode, data) => {
          console.log(JSON.stringify(data, null, 1))
          assert.equal(statusCode, 200)
          assert.equal(data.jobRunID, jobID)
          assert.isNotEmpty(data.data)
          assert.isAbove(Number(data.result), 0)
          assert.isAbove(Number(data.data.result), 0)
          done()
        })
      })
    })
  })

  context('error calls', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      { name: 'unknown base', testData: { id: jobID, data: { base: 'not_real' } } }
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
