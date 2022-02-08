import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { NAME } from './config'

const adapterContext = { name: NAME }

export const server = expose(adapterContext, makeExecute()).server
