import { expose, util } from '@chainlink/ea-bootstrap'
import { execute } from './adapter'

const NAME = 'JSON-RPC'
const handlers = expose(util.wrapExecute(execute))
export { NAME, execute, handlers }
