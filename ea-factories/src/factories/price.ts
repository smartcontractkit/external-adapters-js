import { ExecuteFactory, Execute, Config } from '@chainlink/types'
// TODO make new Config type for implementation factories
export const priceFactory: ExecuteFactory<Config> = (config) => {
  return {} as Execute // Placeholder
}
