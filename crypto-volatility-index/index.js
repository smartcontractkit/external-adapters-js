const { expose } = require('@chainlink/ea-bootstrap')
const { execute, bootstrap } = require('./adapter')

bootstrap()

module.exports = expose(execute)
