export type Config = {
  source: string
}

export const makeConfig = (prefix = ''): Config => {
  return {
    source: 'test',
  }
}
