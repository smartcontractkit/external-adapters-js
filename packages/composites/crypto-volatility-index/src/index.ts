import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig } from './config'

const NAME = 'CRYPTO_VOLATILITY_INDEX'

export = { NAME, makeExecute, makeConfig, ...expose(makeExecute()) }
