const { Requester } = require('./src/requester')
const { Validator } = require('./src/validator')
const { AdapterError } = require('./src/errors')
const { logger } = require('./src/logger')
const { assertSuccess, assertError } = require('./test/helpers')

module.exports = {
  Requester,
  Validator,
  AdapterError,
  logger,

  // TODO: Move this to @chainlink/test-helpers and remove 'chai' prod dependency
  // without witch `docker-synth-index` build is broken.
  assertSuccess,
  assertError,
}
