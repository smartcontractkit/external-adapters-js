import { Config as BaseConfig } from '@chainlink/types'
import { Requester } from '@chainlink/ea-bootstrap'
import xbci from './indices/xbci'
import xlci from './indices/xlci'

export const INDICES = ['xbci', 'xlci']
export type IndexType = typeof INDICES[number]

export type Config = BaseConfig & {
  indices: {
    [key in IndexType]: string
  }
}

export const makeConfig = (prefix?: string): Config => {
  return {
    ...Requester.getDefaultConfig(prefix),
    indices: {
      xbci,
      xlci,
    },
  }
}
