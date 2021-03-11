import { expose } from '@chainlink/ea-bootstrap'
import { execute } from './adapter'

const NAME = 'Tradermade'

export = { NAME, execute, ...expose(execute) }
