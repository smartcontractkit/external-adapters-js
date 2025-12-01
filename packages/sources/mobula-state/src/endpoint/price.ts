import { CryptoPriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import includes from '../config/includes.json'
import { wsTransport } from '../transport/price'

export const inputParameters = new InputParameters(
  {
    base: {
      aliases: ['from', 'coin', 'symbol'],
      required: true,
      type: 'string',
      description: 'The symbol of symbols of the currency to query',
    },
    quote: {
      // 'market' must be included in quote aliases for CryptoPriceEndpoint compatibility.
      aliases: ['to', 'market'],
      required: true,
      type: 'string',
      description: 'The symbol of the currency to convert to',
    },
  },
  [
    {
      base: 'EZETH',
      quote: 'USD',
    },
  ],
)

// Transform base/quote to uppercase and resolve via includes.json
// This makes lookups case-insensitive and resolves symbols to IDs
const transformBaseQuote = (base: string, quote: string): { base: string; quote: string } => {
  // Uppercase for case-insensitive lookup
  const upperBase = base.toUpperCase()
  const upperQuote = quote.toUpperCase()

  // Try to find matching entry in includes.json
  const includeEntry = includes.find(
    (entry) => entry.from.toUpperCase() === upperBase && entry.to.toUpperCase() === upperQuote,
  )

  if (includeEntry && includeEntry.includes && includeEntry.includes.length > 0) {
    // Use the first include entry's from/to values (asset IDs)
    return {
      base: includeEntry.includes[0].from,
      quote: includeEntry.includes[0].to,
    }
  }

  // Not found in includes - return uppercased originals
  // They might be direct asset IDs or will be validated later
  return { base: upperBase, quote: upperQuote }
}

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new CryptoPriceEndpoint({
  name: 'price',
  aliases: ['state', 'crypto'],
  transport: wsTransport,
  inputParameters,
  requestTransforms: [
    // Transform base/quote using includes.json for case-insensitive symbol resolution
    (req) => {
      const transformed = transformBaseQuote(
        req.requestContext.data.base,
        req.requestContext.data.quote,
      )
      req.requestContext.data.base = transformed.base
      req.requestContext.data.quote = transformed.quote
      return req
    },
  ],
})
