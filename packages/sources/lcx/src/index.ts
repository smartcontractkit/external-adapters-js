import { expose } from '@chainlink/ea-bootstrap'
import { execute } from './adapter'

const NAME = 'lcx'

export = { NAME, execute, ...expose(execute) }
