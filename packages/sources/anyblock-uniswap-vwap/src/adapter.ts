import { Execute } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/external-adapter'
import { util } from '@chainlink/ea-bootstrap'

const customError = (data: any) => {
  return !data.hits || !data.hits.hits || data.hits.hits.length < 1
}

const customParams = {
  address: true,
  debug: false,
  roundDay: false,
  start: false,
  end: false,
}

const buildVWAP = (response: any, debug: boolean) => {
  const sources = response.data.hits.hits.map((i: any) => {
    const reserve0 = i._source.args.find((j: any) => j.pos === 0)
    const reserve1 = i._source.args.find((j: any) => j.pos === 1)
    return {
      timestamp: i._source.timestamp,
      reserve0: parseInt(reserve0['value.hex'], 16),
      reserve1: parseInt(reserve1['value.hex'], 16),
    }
  })

  let overallVolume = 0
  let sumAmountAndPrices = 0
  for (let i = 1; i < sources.length; i++) {
    const reserve0volume = Math.abs(sources[i].reserve0 - sources[i - 1].reserve0)
    const price = sources[i].reserve0 / sources[i].reserve1
    overallVolume += reserve0volume
    sumAmountAndPrices += price * reserve0volume
  }

  const vwap = sumAmountAndPrices / overallVolume
  const resp: any = {
    status: response.status,
    data: { result: vwap },
  }

  if (debug) resp.data.raw = sources
  return resp
}

const cleanupDate = (inputDate: string, roundDay: boolean) => {
  let outputDate: number
  try {
    outputDate = parseInt(inputDate)
    if (roundDay) {
      const date = new Date(outputDate)
      date.setUTCHours(0, 0, 0, 0)
      outputDate = date.getTime()
    }
  } catch (err) {
    return inputDate
  }
  return outputDate
}

// TODO: enable other networks
const getAnyblockUrl = () => 'https://api.anyblock.tools/ethereum/ethereum/mainnet/es/event/search/'

export const execute: Execute = async (input) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  // TODO: validate this is a checksum address
  const address = validator.validated.data.address
  const debug = validator.validated.data.debug || false
  const roundDay = validator.validated.data.roundDay || false
  let start = validator.validated.data.start
  let end = validator.validated.data.end

  const url = getAnyblockUrl()

  end = cleanupDate(end, roundDay)
  start = cleanupDate(start, roundDay)

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
          { term: { 'address.raw': address } },
          { term: { 'event.raw': 'Sync' } },
          {
            range: {
              timestamp: {
                gte: start,
                lte: end,
              },
            },
          },
        ],
      },
    },
    sort: [{ timestamp: 'asc' }],
    size: 10000,
    _source: ['timestamp', 'args'],
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${util.getRandomRequiredEnv('API_KEY')}`,
  }

  const config = {
    url,
    headers,
    data: body,
  }

  const response = await Requester.request(config, customError)
  const vwapResp = buildVWAP(response, debug)
  return Requester.success(jobRunID, vwapResp)
}
