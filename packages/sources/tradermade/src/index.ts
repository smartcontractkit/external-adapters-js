import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig } from './config'

const NAME = 'TRADERMADE'

export = { NAME, makeExecute, makeConfig, ...expose(makeExecute()) }
