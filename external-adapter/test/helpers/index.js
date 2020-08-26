const { assert } = require('chai')

exports.assertError = (statusCode, data, expectedJobId) => {
  assert.equal(statusCode.actual, statusCode.expected)
  assert.equal(data.jobRunID, expectedJobId)
  assert.equal(data.status, 'errored')
  assert.isNotEmpty(data.error)
}

exports.assertSuccess = (statusCode, data, expectedJobId) => {
  assert.equal(statusCode.actual, statusCode.expected)
  assert.equal(data.jobRunID, expectedJobId)
  assert.isEmpty(data.error)
  assert.isNotEmpty(data.data)
  assert.equal(data.result, data.data.result)
}
