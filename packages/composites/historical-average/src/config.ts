export type Config = {
  source: string
}

export const makeConfig = (): Config => {
  return {
    source: 'test',
  }
}
