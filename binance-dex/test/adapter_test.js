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
            base: 'BNB',
            quote: 'BUSD-BD1',
          },
        },
      },
      {
        name: 'base/quote',
        testData: {
          id: jobID,
          data: {
            base: 'BNB',
            quote: 'BUSD-BD1',
          },
        },
      },
      {
        name: 'from/to',
        testData: {
          id: jobID,
          data: {
            from: 'BNB',
            to: 'BUSD-BD1',
          },
        },
      },
      {
        name: 'coin/market',
        testData: {
          id: jobID,
          data: {
            coin: 'BNB',
            market: 'BUSD-BD1',
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
          assert.isAbove(data.result, 0)
          assert.isAbove(data.data.result, 0)
          done()
        })
      })
    })
  })

  context('error calls', () => {
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
          data: { base: 'ETH' },
        },
      },
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
            base: 'ETH',
            quote: 'not_real',
          },
        },
      },
      {
        name: 'unknown dummy endpoint',
        testData: {
          id: jobID,
          data: {
            coin: 'BNB',
            market: 'BUSD-BD1',
            endpoint: 'dummy',
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
