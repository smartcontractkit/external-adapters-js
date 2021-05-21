import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'

const NAME = 'GOOGLE_WEATHER'

export = { NAME, makeExecute, ...expose(makeExecute()) }
