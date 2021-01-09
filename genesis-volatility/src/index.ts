import { expose, util } from '@chainlink/ea-bootstrap'
import { makeConfig, makeExecute } from './adapter'

const NAME = 'GenesisVolatility'

export = { NAME, makeExecute, makeConfig, ...expose(util.wrapExecute(makeExecute())) }
