import { expose, util } from '@chainlink/ea-bootstrap'
import { execute, executeWithDefaults } from './adapter'
import { getConfig } from './src/config'

const NAME = 'CRYPTO_VOLATILITY_INDEX'

export = { NAME, execute, ...expose(util.wrapExecute(executeWithDefaults)), getConfig }
