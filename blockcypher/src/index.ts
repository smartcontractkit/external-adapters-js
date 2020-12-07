import { expose, util } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'

const NAME = 'BLOCKCYPHER'

export = { NAME, makeExecute, ...expose(util.wrapExecute(makeExecute())) }
