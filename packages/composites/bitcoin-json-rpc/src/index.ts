import { makeExecute } from './adapter'
import { expose } from '@chainlink/ea-bootstrap'
import { NAME } from './config'

const adapterContext = { name: NAME }

const { server } = expose(adapterContext, makeExecute())
export { NAME, makeExecute, server }
