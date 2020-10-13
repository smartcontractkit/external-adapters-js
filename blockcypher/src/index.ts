import { expose } from '@chainlink/ea-bootstrap'
import { execute, executeWithDefaults } from './adapter'
import { getConfig } from './config'

export = { execute, ...expose(executeWithDefaults), getConfig }
