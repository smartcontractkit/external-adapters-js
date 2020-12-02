import { expose, util } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'

const NAME = 'BLOCKCHAIN_COM'

export = { NAME, makeExecute, ...expose(util.wrapExecute(makeExecute())) }
