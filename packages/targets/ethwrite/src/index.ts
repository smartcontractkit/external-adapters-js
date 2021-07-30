import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig } from './config'

const NAME = 'ETHWRITE'

export = { NAME, makeExecute, makeConfig, ...expose(NAME, makeExecute()) }
