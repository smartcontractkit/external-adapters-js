import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/stock-quotes'
import { buildWsTransport } from './ws'

const logger = makeLogger('StockQuotesTransport')

// ["eventSymbol","eventTime","sequence","timeNanoPart","bidTime","bidExchangeCode",
//  "bidPrice","bidSize","askTime","askExchangeCode","askPrice","askSize"]
const eventSymbolIndex = 0
const bidTimeIndex = 4
const bidPriceIndex = 6
const bidSizeIndex = 7
const askTimeIndex = 8
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

    return Array.from({ length: data.length / dataLength }, (_, i) => i * dataLength)
      .map((i) => generateResponse(data, i))
      .flat()
  },
)

const generateResponse = (data: (string | number)[], i: number) => {
  const bidVolume = Number(data[i + bidSizeIndex])
  const askVolume = Number(data[i + askSizeIndex])
  const invalidVolume = Number.isNaN(Number(bidVolume)) || Number.isNaN(Number(askVolume))
  const bidPrice = Number(data[i + bidPriceIndex])
  const askPrice = Number(data[i + askPriceIndex])

  let midPrice: number

  if (bidPrice == 0) {
    midPrice = askPrice
  } else if (askPrice == 0) {
    midPrice = bidPrice
  } else {
    midPrice = (askPrice + bidPrice) / 2
  }

  const params = { base: data[i + eventSymbolIndex].toString() }
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
      providerIndicatedTimeUnixMs: Math.max(
        Number(data[i + bidTimeIndex]),
        Number(data[i + askTimeIndex]),
      ),
    },
  }

  return [
    { params: { ...params, requireVolume: false }, response },
    {
      params: { ...params, requireVolume: true },
      response: invalidVolume
        ? {
            statusCode: 502,
            errorMessage: `Bid volume: ${bidVolume} or Ask volume: ${askVolume} for ${params.base} is invalid.`,
          }
        : response,
    },
  ]
}
