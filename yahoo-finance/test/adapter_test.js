const assert = require('chai').assert
const { execute } = require('../adapter')

describe('execute', () => {
  const jobID = '1'

  context('successful calls @integration', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: { data: { base: '^FTSE' } },
      },
      {
        name: 'base',
        testData: {
          id: jobID,
          data: { base: 'N225' },
        },
      },
      {
        name: 'from',
        testData: {
          id: jobID,
          data: { from: 'N225' },
        },
      },
      {
        name: 'asset',
        testData: {
          id: jobID,
          data: { asset: 'N225' },
        },
      },
      {
        name: 'common key FTSE',
        testData: {
          id: jobID,
          data: { asset: 'FTSE' },
        },
      },
      {
        name: 'common key BZ',
        testData: {
          id: jobID,
          data: { asset: 'BZ' },
        },
      },
      {
        name: 'common key AUD',
        testData: {
          id: jobID,
          data: { asset: 'AUD' },
        },
      },
      {
        name: 'common key CHF',
        testData: {
          id: jobID,
          data: { asset: 'CHF' },
        },
      },
      {
        name: 'common key EUR',
        testData: {
          id: jobID,
          data: { asset: 'EUR' },
        },
      },
      {
        name: 'common key GBP',
        testData: {
          id: jobID,
          data: { asset: 'GBP' },
        },
      },
      {
        name: 'common key JPY',
        testData: {
          id: jobID,
          data: { asset: 'JPY' },
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

  context('error calls @integration', () => {
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
        name: 'unknown base',
        testData: {
          id: jobID,
          data: { base: 'not_real' },
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
})
