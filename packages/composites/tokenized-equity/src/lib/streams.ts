import { Requester } from '@chainlink/external-adapter-framework/util/requester'

import { getDeutscheBoersePrice } from '@chainlink/data-engine-adapter'
import { BaseEndpointTypes } from '@chainlink/data-engine-adapter/src/endpoint/deutscheBoerseV11'
import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'

type DataEngineResponse = BaseEndpointTypes['Response']['Data']

export const getPrice = async (
  url: string,
  requester: Requester,
  regularStreamId: string,
  extendedStreamId: string,
  overnightStreamId: string,
  overnightStreamMaxAgeInSeconds?: number,
) => {
  const [regular, extended, overnight] = await Promise.allSettled(
    [regularStreamId, extendedStreamId, overnightStreamId].map((streamId) =>
      getDeutscheBoersePrice(
        streamId,
        url,
        requester,
        streamId === overnightStreamId ? { maxAgeInSeconds: overnightStreamMaxAgeInSeconds } : {},
      ),
    ),
  )

  const stream = getStream(regular, extended, overnight)

  return {
    price: stream.mid,
    spread: BigInt(stream.ask) - BigInt(stream.bid),
    decimals: stream.decimals,
    data: {
      regular: regular.status === 'fulfilled' ? regular.value : undefined,
      extended: extended.status === 'fulfilled' ? extended.value : undefined,
      overnight: overnight.status === 'fulfilled' ? overnight.value : undefined,
    },
  }
}

const getStream = (
  regular: PromiseSettledResult<DataEngineResponse>,
  extended: PromiseSettledResult<DataEngineResponse>,
  overnight: PromiseSettledResult<DataEngineResponse>,
) => {
  if (
    regular.status === 'fulfilled' &&
    regular.value.marketStatus === TwentyfourFiveMarketStatus.REGULAR
  ) {
    return regular.value
  } else if (
    extended.status === 'fulfilled' &&
    (extended.value.marketStatus === TwentyfourFiveMarketStatus.POST_MARKET ||
      extended.value.marketStatus === TwentyfourFiveMarketStatus.PRE_MARKET)
  ) {
    return extended.value
  } else if (
    overnight.status === 'fulfilled' &&
    overnight.value.marketStatus === TwentyfourFiveMarketStatus.OVERNIGHT
  ) {
    return overnight.value
  } else {
    throw new AdapterError({
      statusCode: 503,
      message: `Market is not open: regular ${
        regular.status === 'fulfilled'
          ? ` ${TwentyfourFiveMarketStatus[regular.value.marketStatus]}`
          : ` ${regular.reason}`
      }, extended ${
        extended.status === 'fulfilled'
          ? ` ${TwentyfourFiveMarketStatus[extended.value.marketStatus]}`
          : ` ${extended.reason}`
      }, overnight ${
        overnight.status === 'fulfilled'
          ? ` ${TwentyfourFiveMarketStatus[overnight.value.marketStatus]}`
          : ` ${overnight.reason}`
      }`,
    })
  }
}
