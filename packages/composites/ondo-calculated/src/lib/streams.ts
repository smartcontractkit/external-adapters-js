import { Requester } from '@chainlink/external-adapter-framework/util/requester'

import { getDeutscheBoersePrice } from '@chainlink/data-engine-adapter'
import { BaseEndpointTypes } from '@chainlink/data-engine-adapter/src/endpoint/deutscheBoerseV11'
import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'

type DataEngineResponse = BaseEndpointTypes['Response']['Data']

export const getPrice = async (
  regularStreamId: string,
  extendedStreamId: string,
  overnightStreamId: string,
  url: string,
  requester: Requester,
) => {
  const [regular, extended, overnight] = await Promise.all(
    [regularStreamId, extendedStreamId, overnightStreamId].map((streamId) =>
      getDeutscheBoersePrice(streamId, url, requester),
    ),
  )

  const stream = getStream(regular, extended, overnight)

  return {
    price: stream.mid,
    decimals: stream.decimals,
    data: {
      regular,
      extended,
      overnight,
    },
  }
}

const getStream = (
  regular: DataEngineResponse,
  extended: DataEngineResponse,
  overnight: DataEngineResponse,
) => {
  if (regular.marketStatus === TwentyfourFiveMarketStatus.REGULAR) {
    return regular
  } else if (
    extended.marketStatus === TwentyfourFiveMarketStatus.POST_MARKET ||
    extended.marketStatus === TwentyfourFiveMarketStatus.PRE_MARKET
  ) {
    return extended
  } else if (overnight.marketStatus === TwentyfourFiveMarketStatus.OVERNIGHT) {
    return overnight
  } else {
    throw new AdapterError({
      statusCode: 503,
      message: `Market is not open: regular ${
        TwentyfourFiveMarketStatus[regular.marketStatus]
      }, extended ${TwentyfourFiveMarketStatus[extended.marketStatus]}, overnight ${
        TwentyfourFiveMarketStatus[overnight.marketStatus]
      }`,
    })
  }
}
