import { expose, util } from '@chainlink/ea-bootstrap'
import { execute } from './adapter'

const NAME = 'ONCHAIN'

export = { NAME, execute, ...expose(util.wrapExecute(execute)) }
