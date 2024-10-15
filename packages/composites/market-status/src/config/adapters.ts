export const adapterNames = ['NCFX', 'TRADINGHOURS'] as const

export type AdapterName = (typeof adapterNames)[number]

// Mapping from market to primary and secondary adapters.
export const marketAdapters: Record<string, Record<'primary' | 'secondary', AdapterName>> = {
  __default: {
    primary: 'TRADINGHOURS',
    secondary: 'NCFX',
  },
}
