import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig } from './config'

const NAME = 'ORCHID_BANDWIDTH'

export = { NAME, makeExecute, makeConfig, ...expose(makeExecute()) }
