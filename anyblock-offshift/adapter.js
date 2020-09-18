const { Requester, Validator } = require('@chainlink/external-adapter')

const customError = (data) => {
  return !data.hits || !data.hits.hits || data.hits.hits.length < 1
}

const customParams = {
  debug: false,
  roundDay: false,
  start: false,
  end: false
}

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${process.env.API_KEY}`
}

function buildVWAP (response, debug) {
  const sources = response.data.hits.hits.map(i => {
    const reserve0 = i._source.args.find(j => j.pos === 0)
    const reserve1 = i._source.args.find(j => j.pos === 1)
    return {
      timestamp: i._source.timestamp,
      reserve0: parseInt(reserve0['value.hex'], 16),
      reserve1: parseInt(reserve1['value.hex'], 16)
    }
  })

  let overallVolume = 0
  let sumAmountAndPrices = 0
  for (let i = 1; i < sources.length; i++) {
    const reserve0volume = Math.abs(sources[i].reserve0 - sources[i - 1].reserve0)
    const price = sources[i].reserve0 / sources[i].reserve1
    // reserve1volume: Math.abs(sources[i].reserve1 - sources[i - 1].reserve1),
    overallVolume += reserve0volume
    sumAmountAndPrices += price * reserve0volume
  }

  const r = {
    status: response.status,
    data: {
      result: {
        volume: overallVolume,
        vwap: sumAmountAndPrices / overallVolume
      }
    }
  }

  if (debug) {
    r.data.raw = sources
  }
  return r
}

const createRequest = (input, callback) => {
  const validator = new Validator(callback, input, customParams)
  const jobRunID = validator.validated.id
  const debug = validator.validated.data.debug || false
  const roundDay = validator.validated.data.roundDay || false
  let start = validator.validated.data.start
  let end = validator.validated.data.end
  const url = 'https://api.anyblock.tools/ethereum/ethereum/mainnet/es/event/search/'

  try {
    end = parseInt(end)
    if (roundDay) {
      const date = new Date(end)
      date.setUTCHours(0, 0, 0, 0)
      end = date.getTime()
    }
  } catch (err) {
  }

  try {
    start = parseInt(start)
    if (roundDay) {
      const date = new Date(start)
      date.setUTCHours(0, 0, 0, 0)
      start = date.getTime()
    }
  } catch (err) {
  }

  if (!start && !end) {
    const date = new Date()
    date.setUTCHours(0, 0, 0, 0)
    end = date.getTime() / 1000

    start = end - 60 * 60 * 24
  } else if (!start) {
    start = end - 60 * 60 * 24
  } else if (!end) {
    end = start + 60 * 60 * 24
  } else if (start === end) {
    start = end - 60 * 60 * 24
  }

  const body = {
    query: {
      bool: {
        filter: [
          { term: { 'address.raw': '0x2B9e92A5B6e69Db9fEdC47a4C656C9395e8a26d2' } },
          { term: { 'event.raw': 'Sync' } },
          {
            range: {
              timestamp: {
                gte: start,
                lte: end
              }
            }
          }
        ]
      }
    },
    sort: [
      { timestamp: 'asc' }
    ],
    size: 10000,
    _source: ['timestamp', 'args']
  }

  Requester.request({
    url,
    headers,
    data: body
  },
  customError)
    .then(response => {
      const r = buildVWAP(response, debug)
      // response.data.result = Requester.validateResultNumber(response.data, [speed]) * 1e9
      callback(r.status, Requester.success(jobRunID, r))
    })
    .catch(error => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

module.exports.createRequest = createRequest
