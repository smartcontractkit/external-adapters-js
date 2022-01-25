import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['vwap']

const customError = (data: ResponseSchema) => {
  return !data.hits || !data.hits.hits || data.hits.hits.length < 1
}

export const inputParameters: InputParameters = {
  address: {
    description: 'Uniswap pool **checksum address**',
    type: 'string',
    required: true,
  },
  debug: {
    description: 'Switch to show `raw` trade value',
    type: 'boolean',
    default: false,
  },
  roundDay: {
    description: 'Round the start and end to midnight UTC',
    type: 'boolean',
    default: false,
  },
  start: {
    description: 'Epoch timestamp in seconds. Defaults to current time - 24hrs.',
    type: 'string',
  },
  end: {
    description: 'Epoch timestamp in seconds. Defaults to current time.',
    type: 'string',
  },
}

export interface ResponseSchema {
  took: number
  timed_out: boolean
  _shards: { total: number; successful: number; skipped: number; failed: number }
  hits: {
    total: []
    max_score: number
    hits: {
      _index: string
      _type: string
      _id: string
      _score: number
      _source: {
        args: {
          'value.hex': string
          pos: number
          name: string
          'value.type': string
        }[]
        timestamp: number
      }
      sort: []
    }[]
  }
}

const buildVWAP = (data: ResponseSchema, status: number, debug: boolean) => {
  const sources = data.hits.hits.map((i) => {
    const reserve0 = i._source.args.find((j) => j.pos === 0)
    const reserve1 = i._source.args.find((j) => j.pos === 1)
    return {
      timestamp: i._source.timestamp,
      reserve0: parseInt(reserve0 ? reserve0['value.hex'] : '0', 16),
      reserve1: parseInt(reserve1 ? reserve1['value.hex'] : '0', 16),
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
  const resp: { status: number; data: { result: number; raw?: Record<string, number>[] } } = {
    status: status,
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

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  // TODO: validate this is a checksum address
  const address = validator.validated.data.address
  const debug = validator.validated.data.debug
  const roundDay = validator.validated.data.roundDay
  let start = validator.validated.data.start
  let end = validator.validated.data.end

  const url = '/ethereum/ethereum/mainnet/es/event/search/'

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

  const options = {
    ...config.api,
    url,
    data: body,
  }

  const response = await Requester.request<ResponseSchema>(options, customError)
  const vwapResp = buildVWAP(response.data, response.status, debug)
  return Requester.success(jobRunID, vwapResp, config.verbose)
}
