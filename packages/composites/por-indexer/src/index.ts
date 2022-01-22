import { makeExecute } from './adapter'
import { expose } from '@chainlink/ea-bootstrap'

const NAME = 'POR_INDEXER'
export = { NAME, makeExecute, ...expose(NAME, makeExecute()) }
