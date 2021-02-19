import { expose } from '@chainlink/ea-bootstrap'
import { execute } from './adapter'

const NAME = 'LinkPool'

export = { NAME, execute, ...expose(execute) }
