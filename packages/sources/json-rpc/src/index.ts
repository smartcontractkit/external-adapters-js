import { expose } from '@chainlink/ea-bootstrap'
import { execute, makeExecute } from './adapter'
import { makeConfig } from './config'

const NAME = 'JSON-RPC'

export = { NAME, execute, makeConfig, ...expose(makeExecute()) }
