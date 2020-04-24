const assert = require('chai').assert
const createRequest = require('../adapter').createRequest

describe('createRequest', () => {
  const jobID = '1'

  context('successful calls', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: { data: { base: 'XAU' } }
      },
      {
        name: 'base',
        testData: {
          id: jobID,
          data: { base: 'XAU' }
        }
      },
      {
        name: 'from',
        testData: {
          id: jobID,
          data: { from: 'XAU' }
        }
      },
      {
        name: 'asset',
        testData: {
          id: jobID,
          data: { asset: 'XAU' }
        }
      }
    ]

    requests.forEach(req => {
      it(`${req.name}`, (done) => {
        createRequest(req.testData, (statusCode, data) => {
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
      {
        name: 'empty body',
        testData: {}
      },
      {
        name: 'empty data',
        testData: { data: {} }
      },
      {
        name: 'unknown base',
        testData: {
          id: jobID,
          data: { base: 'not_real' }
        }
      }
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
