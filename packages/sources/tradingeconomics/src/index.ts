import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig, makeWSHandler, NAME } from './config'

export = { NAME, makeExecute, makeConfig, ...expose(makeExecute(), makeWSHandler(makeConfig())) }
