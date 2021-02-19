import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig } from './config'

const NAME = 'SOCHAIN'

export = { NAME, makeExecute, makeConfig, ...expose(makeExecute()) }
