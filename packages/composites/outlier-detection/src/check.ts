import { AdapterImplementation } from '@chainlink/types'
// check adapters
import OilpriceAPI from '@chainlink/oilpriceapi-adapter'
import Deribit from '@chainlink/deribit-adapter'
import dxFeed from '@chainlink/dxfeed-adapter'

export const adapters: AdapterImplementation[] = [OilpriceAPI, Deribit, dxFeed]

export type Check = typeof adapters[number]['NAME']
