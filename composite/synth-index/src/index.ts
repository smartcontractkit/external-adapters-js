import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig } from './config'

const NAME = 'SYNTH-INDEX'

export = { NAME, makeConfig, makeExecute, ...expose(makeExecute()) }
