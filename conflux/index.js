const { expose } = require('@chainlink/ea-bootstrap')
const { createRequest } = require('./adapter')

module.exports = expose(createRequest)
