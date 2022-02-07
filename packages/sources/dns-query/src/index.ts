import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig, NAME } from './config'
import rateLimit from './config/limits.json'

const adapterContext = { name: NAME, rateLimit }

export = { NAME, makeConfig, makeExecute, ...expose(adapterContext, makeExecute()) }
