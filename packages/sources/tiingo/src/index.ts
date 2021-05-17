import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute, makeWSHandler } from './adapter'
import { NAME, makeConfig } from './config'

export = { NAME, makeExecute, makeConfig, ...expose(makeExecute(), makeWSHandler()) }
