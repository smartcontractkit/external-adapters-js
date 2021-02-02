import { makeConfig } from './config'
import { makeExecute } from './adapter'
import { expose, util } from '@chainlink/ea-bootstrap'

const NAME = 'BITCOIN-JSON-RPC'
export = { NAME, makeExecute, makeConfig, ...expose(util.wrapExecute(makeExecute())) }
