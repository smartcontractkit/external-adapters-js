import { expose } from '@chainlink/ea-bootstrap'
import { execute } from './adapter'

const NAME = 'CRYPTO_VOLATILITY_INDEX'

export = { NAME, execute, ...expose(execute) }