const { expose, util } = require('@chainlink/ea-bootstrap')
const { execute } = require('./adapter')

module.exports = expose(util.wrapExecute(execute))
