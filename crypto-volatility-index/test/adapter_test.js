const { assert } = require('chai')
const { assertSuccess } = require('@chainlink/external-adapter')
const { execute } = require('../adapter')
const config = require('../src/config')

describe.only('execute', () => {
  const jobID = '1'

  context('required configrurations variables were supplied', () => {
    Object.keys(config).forEach((key) => {
      it(`${key} is set`, (done) => {
        assert.exists(config[key])
        done()
      })
    })
  })

  context('successful calls @integration', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: { data: {} },
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
})
