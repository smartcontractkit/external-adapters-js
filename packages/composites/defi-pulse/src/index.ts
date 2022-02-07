import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { NAME, makeConfig } from './config'

const adapterContext = { name: NAME }

export = { makeExecute, makeConfig, ...expose(adapterContext, makeExecute()) }
