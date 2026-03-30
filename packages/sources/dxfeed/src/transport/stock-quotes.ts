import { makeLogger, splitArrayIntoChunks } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/stock-quotes'
import { buildWsTransport } from './ws'

const logger = makeLogger('StockQuotesTransport')

// ["eventSymbol","eventTime","sequence","timeNanoPart","bidTime","bidExchangeCode",
//  "bidPrice","bidSize","askTime","askExchangeCode","askPrice","askSize"]
const eventSymbolIndex = 0
const bidTimeIndex = 4
const bidExchangeCodeIndex = 5
const bidPriceIndex = 6
const bidSizeIndex = 7
const askTimeIndex = 8
const askExchangeCodeIndex = 9
const askPriceIndex = 10
const askSizeIndex = 11
const dataLength = 12

export const transport = buildWsTransport<BaseEndpointTypes>(
  (params) => [{ Quote: [params.base.toUpperCase()] }],
  (message) => {
    if (message[0].data[0] != 'Quote' && message[0].data[0][0] != 'Quote') {
      return []
    }
    const data = message[0].data[1]

    if (data.length % dataLength != 0) {
      logger.warn(
        `${JSON.stringify(data)} is invalid since length is not multiple of ${dataLength}.`,
      )
      return []
    }

    return splitArrayIntoChunks(data, dataLength).flatMap((chunk) => generateResponse(chunk))
  },
)

const generateResponse = (data: (string | number)[]) => {
  const bidVolume = Number(data[bidSizeIndex])
  const askVolume = Number(data[askSizeIndex])
  const invalidVolume = Number.isNaN(Number(bidVolume)) || Number.isNaN(Number(askVolume))
  const bidPrice = Number(data[bidPriceIndex])
  const askPrice = Number(data[askPriceIndex])

  const params = { base: data[eventSymbolIndex].toString() }
  if (Number.isNaN(bidPrice) || Number.isNaN(askPrice)) {
    const response = {
      statusCode: 502,
      errorMessage: `Bid price: ${bidPrice} or Ask price: ${askPrice} for ${params.base} is invalid.`,
    }
    return [
      { params: { ...params, requireVolume: false, isOvernight: true }, response },
      { params: { ...params, requireVolume: true, isOvernight: true }, response },
      { params: { ...params, requireVolume: false, isOvernight: false }, response },
      { params: { ...params, requireVolume: true, isOvernight: false }, response },
    ]
  }

  let midPrice: number

  if (bidPrice == 0) {
    midPrice = askPrice
  } else if (askPrice == 0) {
    midPrice = bidPrice
  } else {
    midPrice = (askPrice + bidPrice) / 2
  }

  const response = {
    result: null,
    data: {
      mid_price: midPrice,
      bid_price: bidPrice,
      bid_volume: bidVolume,
      ask_price: askPrice,
      ask_volume: askVolume,
    },
    timestamps: {
      providerIndicatedTimeUnixMs: Math.max(Number(data[bidTimeIndex]), Number(data[askTimeIndex])),
    },
  }

  const requireVolumeResponse = invalidVolume
    ? {
        statusCode: 502,
        errorMessage: `Bid volume: ${bidVolume} or Ask volume: ${askVolume} for ${params.base} is invalid.`,
      }
    : response

  const responses = [
    { params: { ...params, requireVolume: false, isOvernight: false }, response },
    {
      params: { ...params, requireVolume: true, isOvernight: false },
      response: requireVolumeResponse,
    },
  ]

  if (data[bidExchangeCodeIndex] === 'O' && data[askExchangeCodeIndex] === 'O') {
    responses.push({
      params: { ...params, requireVolume: false, isOvernight: true },
      response,
    })
    responses.push({
      params: { ...params, requireVolume: true, isOvernight: true },
      response: requireVolumeResponse,
    })
  }

  return responses
}
