const { assert } = require('chai')
const { assertSuccess } = require('@chainlink/external-adapter')
const { execute } = require('../adapter')

describe('execute', () => {
  const jobID = '1'

  context('successful calls @integration', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: { data: {} },
      },
      {
        name: 'id is supplied',
        testData: { id: jobID, data: {} },
      },
      { name: 'empty body', testData: {} },
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
})
