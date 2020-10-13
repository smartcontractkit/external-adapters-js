import { expose } from '@chainlink/ea-bootstrap'
import { execute, executeSync } from './adapter'
import { getConfig } from './config'

export = { execute, ...expose(executeSync), getConfig }
