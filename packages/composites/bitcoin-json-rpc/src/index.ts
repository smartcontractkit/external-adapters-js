import { makeExecute } from './adapter'
import { expose } from '@chainlink/ea-bootstrap'

const NAME = 'BITCOIN-JSON-RPC'
export = { NAME, makeExecute, ...expose(makeExecute()) }
