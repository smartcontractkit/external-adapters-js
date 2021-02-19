import { expose } from '@chainlink/ea-bootstrap'
import { execute } from './adapter'

const NAME = 'Finage'

export = { NAME, execute, ...expose(execute) }
