import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute, makeWSHandler } from './adapter'
import { makeConfig } from './config'

const NAME = 'COINBASE'

export = { NAME, makeExecute, makeConfig, ...expose(makeExecute(), makeWSHandler()) }
