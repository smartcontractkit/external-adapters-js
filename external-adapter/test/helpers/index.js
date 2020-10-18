const { assert } = require('chai')

exports.assertError = (statusCode, data, expectedJobId) => {
  assert.equal(statusCode.actual, statusCode.expected)
  assert.equal(data.jobRunID, expectedJobId)
  assert.equal(data.status, 'errored')
  assert.exists(data.error)
  assert.exists(data.error.name)
  assert.exists(data.error.message)
}

exports.assertSuccess = (statusCode, data, expectedJobId) => {
  assert.equal(statusCode.actual, statusCode.expected)
  assert.equal(data.jobRunID, expectedJobId)
  assert.notExists(data.error)
  assert.isNotEmpty(data.data)
  assert.equal(data.result, data.data.result)
}
