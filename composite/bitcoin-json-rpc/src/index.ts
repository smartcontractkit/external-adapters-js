import { expose, util } from '@chainlink/ea-bootstrap'
import { execute } from './adapter'

const NAME = 'BITCOIN-JSON-RPC'

export = { NAME, execute, ...expose(util.wrapExecute(execute)) }
