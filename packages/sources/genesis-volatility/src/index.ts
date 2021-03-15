import { expose } from '@chainlink/ea-bootstrap'
import { makeConfig, makeExecute } from './adapter'

const NAME = 'GENSIS-VOLATILITY'

export = { NAME, makeExecute, makeConfig, ...expose(makeExecute()) }
