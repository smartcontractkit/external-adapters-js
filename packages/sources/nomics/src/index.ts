import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig } from './config'

const NAME = 'NOMICS'

export = { NAME, makeExecute, makeConfig, ...expose(makeExecute()) }
