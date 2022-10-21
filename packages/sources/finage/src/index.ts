import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute, makeWSHandler } from './adapter'
import * as endpoints from './endpoint'
import { makeConfig, NAME } from './config'
import rateLimit from './config/limits.json'

const adapterContext = { name: NAME, rateLimit }

const { server } = expose(adapterContext, makeExecute(), makeWSHandler())
export { NAME, makeExecute, makeConfig, server, endpoints }
