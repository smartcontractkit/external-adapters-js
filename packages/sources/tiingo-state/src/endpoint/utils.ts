import { AdapterRequest } from '@chainlink/external-adapter-framework/util'

export function tiingoCommonSubscriptionRequestTransform() {
  return (req: AdapterRequest<{ base: string; quote: string }>) => {
    req.requestContext.data.base = req.requestContext.data.base.toLowerCase()
    req.requestContext.data.quote = req.requestContext.data.quote.toLowerCase()
  }
}
