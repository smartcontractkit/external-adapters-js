const http = require('http')

const oracleAPI = process.env.AG_SOLO_ORACLE_URL
if (!oracleAPI) {
  throw Error(`Must supply $AG_SOLO_ORACLE_URL`)
}
const oracleUrl = new URL(oracleAPI)

const Nat = (n) => {
  if (!Number.isSafeInteger(n)) {
    throw Error(`${n} is not a safe integer`)
  }
  return n
}

// FIXME: Ideally, these would be the same.
const LINK_DECIMALS = 18
const LINK_AGORIC_DECIMALS = 6
if (LINK_AGORIC_DECIMALS > LINK_DECIMALS) {
  throw Error(
    `LINK_AGORIC_DECIMALS ${LINK_AGORIC_DECIMALS} must be less than or equal to ${LINK_DECIMALS}`,
  )
}

const getRequiredFee = (str) => {
  const digits = str
  const significant = digits.substr(
    0,
    Math.max(0, digits.length - (LINK_DECIMALS - LINK_AGORIC_DECIMALS)),
  )
  const roundUp = digits[significant.length] && parseInt(digits[significant.length], 10) >= 5
  let requiredFee = Nat(parseInt(significant, 10))
  if (roundUp) {
    requiredFee += 1
  }
  return Nat(requiredFee)
}

const send = (obj) =>
  new Promise((resolve, reject) => {
    const data = JSON.stringify(obj)
    const req = http.request(
      {
        hostname: oracleUrl.hostname,
        port: oracleUrl.port,
        path: oracleUrl.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length,
        },
      },
      (res) => {
        if (res.statusCode === 200) {
          resolve(res.statusCode)
        } else {
          reject(res.statusCode)
        }
      },
    )
    req.on('error', reject)
    req.write(data)
    req.end()
  })

const execute = async (input, callback) => {
  const queryId = input.data.agoric_oracle_query_id
  try {
    if (queryId) {
      const requiredFee = getRequiredFee(input.data.payment)
      await send({
        type: 'oracleServer/reply',
        data: { queryId, reply: input.data.result, requiredFee },
      })
    }
    callback(200, {
      jobRunID: input.id,
      data: input.data,
      statusCode: 200,
    })
  } catch (e) {
    const error = `${(e && e.stack) || e}`
    if (queryId) {
      send({
        type: 'oracleServer/error',
        data: { queryId, error },
      })
    }
    callback(400, {
      jobRunID: input.id,
      status: 'errored',
      error: error,
      statusCode: 400,
    })
  }
}

module.exports.execute = execute
