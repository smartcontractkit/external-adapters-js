const { expose } = require('@chainlink/ea-bootstrap')
const { execute } = require('./adapter')

module.exports = expose(execute)
