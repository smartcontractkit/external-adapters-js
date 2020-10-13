import { expose } from '@chainlink/ea-bootstrap'
import { execute, executeWithDefaults } from './adapter'
import { getConfig } from './config'

const NAME = 'BLOCKCYPHER'

export = { NAME, execute, ...expose(executeWithDefaults), getConfig }
