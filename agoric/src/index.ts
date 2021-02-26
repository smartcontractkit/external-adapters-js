import { expose, util } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig } from './config'

const NAME = 'Agoric'
const endpoint = util.getEnv('AG_SOLO_ORACLE_URL')

export = { NAME, makeExecute, makeConfig, ...expose(util.wrapExecute(makeExecute(endpoint))) }
