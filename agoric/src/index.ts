import { expose, util } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeHTTPSender } from './httpSender'

const oracleAPI = util.getRequiredEnv('AG_SOLO_ORACLE_URL')

const send = makeHTTPSender(oracleAPI)

const execute = makeExecute(send)

export = { NAME: 'Agoric', makeExecute, ...expose(util.wrapExecute(execute)) }
