import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig } from './config'

const NAME = '1FORGE'

export = { NAME, makeExecute, makeConfig, ...expose(makeExecute()) }
