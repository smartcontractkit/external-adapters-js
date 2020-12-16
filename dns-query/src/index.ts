import { expose, util } from '@chainlink/ea-bootstrap'
import { execute, inputParams } from './adapter'

const NAME = 'DNS-Query'

export = { NAME, inputParams, execute, ...expose(util.wrapExecute(execute)) }
