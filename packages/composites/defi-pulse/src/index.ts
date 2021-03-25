import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig } from './config'

const NAME = 'DEFI_PULSE'

export = { NAME, makeExecute, makeConfig, ...expose(makeExecute()) }
