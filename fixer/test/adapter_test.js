const assert = require('chai').assert
const { execute } = require('../adapter')

describe('execute', () => {
  const jobID = '1'

  context('successful calls', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: {
          data: {
            base: 'GBP',
            quote: 'USD',
          },
        },
      },
      {
        name: 'base/quote',
        testData: {
          id: jobID,
          data: {
            base: 'GBP',
            quote: 'USD',
          },
        },
      },
      {
        name: 'from/to',
        testData: {
          id: jobID,
          data: {
            from: 'GBP',
            to: 'USD',
          },
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
      {
        name: 'empty data',
        testData: { data: {} },
      },
      {
        name: 'base not supplied',
        testData: {
          id: jobID,
          data: { quote: 'USD' },
        },
      },
      {
        name: 'quote not supplied',
        testData: {
          id: jobID,
          data: { base: 'GBP' },
        },
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

  context('error calls', () => {
    const requests = [
      {
        name: 'unknown base',
        testData: {
          id: jobID,
          data: {
            base: 'not_real',
            quote: 'USD',
          },
        },
      },
      {
        name: 'unknown quote',
        testData: {
          id: jobID,
          data: {
            base: 'GBP',
            quote: 'not_real',
          },
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
