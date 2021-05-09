import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'

const NAME = 'CRYPTO_VOLATILITY_INDEX'

export = { NAME, makeExecute, ...expose(makeExecute()) }
