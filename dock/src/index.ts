import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig } from './config'

const NAME = 'DOCK'

export = { NAME, makeConfig, ...expose(makeExecute()) }
