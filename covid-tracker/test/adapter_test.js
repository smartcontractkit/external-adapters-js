const { assert } = require('chai')
const { assertSuccess, assertError } = require('@chainlink/adapter-test-helpers')
const { execute } = require('../adapter')

describe('execute', () => {
  const jobID = '1'

  context('successful calls @integration', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: { data: { field: 'totalTestResults', location: 'USA' } },
      },
      {
        name: 'without date',
        testData: { id: jobID, data: { field: 'totalTestResultsIncrease', location: 'USA' } },
      },
      {
        name: 'with date',
        testData: { id: jobID, data: { field: 'death', date: '20201010', location: 'USA' } },
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
      { name: 'empty data', testData: { data: {} } },
      {
        name: 'field not supplied',
        testData: { id: jobID, data: { location: 'USA' } },
      },
      {
        name: 'location not supplied',
        testData: { id: jobID, data: { field: 'deaths' } },
      },
      {
        name: 'unknown date format',
        testData: { id: jobID, data: { field: 'deaths', date: 'not_real', location: 'USA' } },
      },
      {
        name: 'unknown date format 2',
        testData: { id: jobID, data: { field: 'deaths', date: '2020111', location: 'USA' } },
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
        name: 'date not found',
        testData: { id: jobID, data: { field: 'deaths', date: '17601010', location: 'USA' } },
      },
      {
        name: 'unknown field',
        testData: { id: jobID, data: { field: 'not_real', location: 'USA' } },
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
