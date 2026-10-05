import {
  CryptoPriceEndpoint,
  DEFAULT_LWBA_ALIASES,
  LwbaResponseDataFields,
  priceEndpointInputParametersDefinition,
  validateLwbaResponse,
} from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterLWBAError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { transport } from '../transport/price'

const inputParameters = new InputParameters(priceEndpointInputParametersDefinition, [
  {
    base: 'ETH',
    quote: 'USD',
  },
])

type OmitResultFromLwba = Omit<LwbaResponseDataFields, 'Result'>

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: OmitResultFromLwba & SingleNumberResultResponse
}

/**
 * Collapses BTC/USD, btc/usd and BTC/usd to one spelling before the cache key
 * is calculated.
 *
 * The subscription set is keyed by cache key, which lowercases every value, so
 * those spellings already share a single entry — but the entry stores the raw
 * params of whichever request arrived last, and the streaming transport compares
 * subscriptions with JSON.stringify. Every time a differently-spelled request
 * lands, the stored value is overwritten and the next background pass reads it
 * as one stale plus one new subscription for the same wire symbol: an
 * unsubscribe and a resubscribe of a feed that never stopped being wanted.
 *
 * That churn ran every ~30-44s per hot pair in staging and desynchronised GSR's
 * per-symbol refcount, after which it accepted subscribes without serving them
 * and the feed stayed dark for the life of the connection (DF-26076).
 *
 * Normalising here rather than in the transport means the two identities agree
 * everywhere downstream. Nothing on the wire changes: the transport already
 * uppercases when it builds the ticker. Cache keys and feed IDs are unaffected
 * too, since both are computed by lowercasing these same values.
 */
const normalizePairCase = (req: { requestContext: { data: unknown } }) => {
  const data = req.requestContext.data as { base?: unknown; quote?: unknown }
  if (typeof data.base === 'string') {
    data.base = data.base.toUpperCase()
  }
  if (typeof data.quote === 'string') {
    data.quote = data.quote.toUpperCase()
  }
}

export const endpoint = new CryptoPriceEndpoint({
  name: 'price',
  aliases: ['price-ws', 'crypto', ...DEFAULT_LWBA_ALIASES],
  transport,
  inputParameters,
  requestTransforms: [normalizePairCase],
  customOutputValidation: (output) => {
    const data = output.data as LwbaResponseDataFields['Data']
    const error = validateLwbaResponse(data.bid, data.mid, data.ask)

    if (error) {
      throw new AdapterLWBAError({ statusCode: 500, message: error })
    }

    return undefined
  },
})
