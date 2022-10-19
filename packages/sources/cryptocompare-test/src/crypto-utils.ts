export const cryptoInputParams = {
  base: {
    aliases: ['from', 'coin', 'fsym'],
    description: 'The symbol of symbols of the currency to query',
    required: true,
    type: 'string',
  },
  quote: {
    aliases: ['to', 'market', 'tsym'],
    description: 'The symbol of the currency to convert to',
    required: true,
    type: 'string',
  },
} as const
