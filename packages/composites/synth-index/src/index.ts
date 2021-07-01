import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'

export const NAME = 'SYNTH-INDEX'
export const server = expose(makeExecute()).server
