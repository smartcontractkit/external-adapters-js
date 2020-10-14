import { expose, util } from '@chainlink/ea-bootstrap'
import { execute, executeWithDefaults } from './adapter'
import { getConfig } from './config'

const NAME = 'WBTC'

export = { NAME, execute, ...expose(util.wrapExecute(executeWithDefaults)), getConfig }
