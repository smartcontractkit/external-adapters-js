import { makeExecute } from './adapter'
import { expose } from '@chainlink/ea-bootstrap'
import { NAME } from './config'

const adapterContext = { name: NAME }

export = { NAME, makeExecute, ...expose(adapterContext, makeExecute()) }
