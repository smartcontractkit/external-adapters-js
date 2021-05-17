import { expose } from '@chainlink/ea-bootstrap'
import { makeConfig, makeExecute } from './adapter'

const NAME = 'DERIBIT'

export = { NAME, makeExecute, makeConfig, ...expose(makeExecute()) }
