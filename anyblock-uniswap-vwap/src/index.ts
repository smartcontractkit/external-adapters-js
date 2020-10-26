import { expose, util } from '@chainlink/ea-bootstrap'
import { execute } from './adapter'

const NAME = 'ANYBLOCK_UNISWAP_VWAP'

export = { NAME, execute, ...expose(util.wrapExecute(execute)) }
