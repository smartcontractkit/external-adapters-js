import { expose } from '@chainlink/ea-bootstrap'
import { execute, executeSync } from './adapter'

export = { execute, ...expose(executeSync) }
