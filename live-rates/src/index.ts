import { expose, util } from '@chainlink/ea-bootstrap'
import { execute } from './adapter'

const NAME = 'Live-Rates'

export = { NAME, execute, ...expose(util.wrapExecute(execute)) }
