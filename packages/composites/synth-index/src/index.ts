import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig } from './config'

const NAME = 'SYNTH_INDEX'

export = { NAME, makeConfig, makeExecute, ...expose(makeExecute()) }
