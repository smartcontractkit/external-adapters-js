import { makeExecute } from './adapter'
import { expose } from '@chainlink/ea-bootstrap'

const NAME = 'BITCOIN_JSON_RPC'
export = { NAME, makeExecute, ...expose(makeExecute()) }
