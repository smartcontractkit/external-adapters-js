export type Config = {
  source: string
}

export const NAME = 'EXAMPLE_COMPOSITE'

export const makeConfig = (): Config => {
  return {
    source: 'test',
  }
}
