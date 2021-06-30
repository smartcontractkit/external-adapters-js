import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig } from './config'

const NAME = 'THE_GRAPH'

export = { NAME, makeConfig, makeExecute, ...expose(makeExecute()) }
