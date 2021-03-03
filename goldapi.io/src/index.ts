import { expose } from '@chainlink/ea-bootstrap'
import { makeConfig, makeExecute } from './adapter'

const NAME = 'GOLDAPI.IO'

export = { NAME, makeExecute, makeConfig, ...expose(makeExecute()) }
