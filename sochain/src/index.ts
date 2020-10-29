import { expose, util } from '@chainlink/ea-bootstrap'
import { execute, executeWithDefaults } from './adapter'
import { getConfig } from './config'

const NAME = 'SOCHAIN'

export = { NAME, execute, ...expose(util.wrapExecute(executeWithDefaults)), getConfig }
