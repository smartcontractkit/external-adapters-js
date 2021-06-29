import { expose } from '@chainlink/ea-bootstrap'
import { makeConfig } from './config'
import { makeExecute } from './adapter'

const NAME = 'OutlierDetection'

export = { NAME, makeExecute, makeConfig, ...expose(makeExecute()) }
