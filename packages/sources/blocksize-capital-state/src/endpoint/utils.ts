import { AdapterRequest } from '@chainlink/external-adapter-framework/util'

export function blocksizeStateSubscriptionRequestTransform() {
  return (req: AdapterRequest<{ base: string; quote?: string }>) => {
    req.requestContext.data.base = req.requestContext.data.base.toLowerCase()
    if (req.requestContext.data.quote) {
      req.requestContext.data.quote = req.requestContext.data.quote.toLowerCase()
    }
  }
}
