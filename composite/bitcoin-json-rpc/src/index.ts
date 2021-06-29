import { makeConfig } from './config'
import { makeExecute } from './adapter'
import { expose } from '@chainlink/ea-bootstrap'

const NAME = 'BITCOIN-JSON-RPC'
export = { NAME, makeExecute, makeConfig, ...expose(makeExecute()) }
