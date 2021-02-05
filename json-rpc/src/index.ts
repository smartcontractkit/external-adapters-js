import { expose } from '@chainlink/ea-bootstrap'
import { execute } from './adapter'

const NAME = 'JSON-RPC'

export = { NAME, execute, ...expose(execute) }
