import { AdapterRequest } from '@chainlink/ea-bootstrap'

export interface Config {
  outputFileName: string
  adapterName: string
  testDurationInSeconds: number
  reqIntervalInSeconds: number
  request: AdapterRequest
}

export const config: Config = {
  outputFileName: 'anchor-bluna-ea.csv',
  adapterName: 'anchor',
  testDurationInSeconds: 12 * 3600,
  reqIntervalInSeconds: 30,
  request: {
    id: '1',
    data: {
      from: 'BLUNA',
      quote: 'USD',
    },
  },
}
