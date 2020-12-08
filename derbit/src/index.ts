import { expose, util } from '@chainlink/ea-bootstrap'
import { execute } from './adapter'

const NAME = 'Derbit'

export = { NAME, execute, ...expose(util.wrapExecute(execute)) }
