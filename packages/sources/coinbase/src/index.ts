import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig, WSHandlerFactory } from './config'

const NAME = 'COINBASE'

export = { NAME, makeExecute, makeConfig, ...expose(makeExecute(), WSHandlerFactory()) }
