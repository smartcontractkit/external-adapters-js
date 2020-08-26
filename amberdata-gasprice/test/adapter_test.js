const assert = require('chai').assert
const { execute } = require('../adapter')

describe('execute', () => {
  const jobID = '1'

  context('successful calls @integration', () => {
    const requests = [
      {
        name: 'empty data',
        testData: { data: {} },
      },
      {
        name: 'no speed param',
        testData: {
          id: jobID,
          data: { endpoint: 'not_real' },
        },
      },
      {
        name: 'id not supplied',
        testData: {
          data: {
            speed: 'fast',
            endpoint: 'ethereum-mainnet',
          },
        },
      },
      {
        name: 'speed is average',
        testData: {
          id: jobID,
          data: { speed: 'average' },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, (done) => {
        execute(req.testData, (statusCode, data) => {
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

  context('validation error', () => {
    const requests = [
      {
        name: 'empty body',
        testData: {},
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, (done) => {
        execute(req.testData, (statusCode, data) => {
          assert.equal(statusCode, 400)
          assert.equal(data.jobRunID, jobID)
          assert.equal(data.status, 'errored')
          assert.isNotEmpty(data.error)
          done()
        })
      })
    })
  })

  context('error calls @integration', () => {
    const requests = [
      {
        name: 'unknown speed',
        testData: {
          id: jobID,
          data: { speed: 'not_real' },
        },
      },
      {
        name: 'unknown endpoint',
        testData: {
          id: jobID,
          data: { speed: 'standard', endpoint: 'not_real' },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, (done) => {
        execute(req.testData, (statusCode, data) => {
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
