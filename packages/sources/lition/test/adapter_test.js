const { assert } = require('chai')
const { assertSuccess, assertError } = require('@chainlink/adapter-test-helpers')
const { execute } = require('../adapter')

describe('execute', () => {
  const jobID = '1'

  context('successful calls @integration', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: { data: { source: 1 } },
      },
      {
        name: 'is is supplied',
        testData: { id: jobID, data: { source: 1 } },
      },
      {
        name: 'with date',
        testData: {
          id: jobID,
          data: { source: 1, date: `${new Date().toISOString().slice(0, 10)}` },
        },
      },
      {
        name: 'with hour',
        testData: { id: jobID, data: { source: 1, hour: 0 } },
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
      { name: 'source not supplied', testData: { data: {} } },
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
        name: 'unknown source',
        testData: { id: jobID, data: { source: 'not_real' } },
      },
      {
        name: 'unknown date',
        testData: { id: jobID, data: { source: 1, date: 'not_real' } },
      },
      {
        name: 'unknown hour',
        testData: { id: jobID, data: { source: 1, hour: 'not_real' } },
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
