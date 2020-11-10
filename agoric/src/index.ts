import { expose, util } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeHTTPSender } from './httpSender'

const oracleAPI = process.env.AG_SOLO_ORACLE_URL
if (!oracleAPI) {
  throw Error(`Must supply $AG_SOLO_ORACLE_URL`)
}

const send = makeHTTPSender(oracleAPI)

const execute = makeExecute(send)

export = { NAME: 'Agoric', execute, ...expose(util.wrapExecute(execute)) }
