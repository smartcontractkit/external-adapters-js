interface RipcordSchema {
  ripcord: boolean
  ripcordDetails: string[]
}

export const checkRipcord = (data: RipcordSchema, noErrorOnRipcord = false) => {
  const ripcord = data.ripcord === true || String(data.ripcord).toLowerCase() === 'true'
  const ripcordAsInt = ripcord ? 1 : 0

  if (ripcord && !noErrorOnRipcord) {
    const ripcordDetails = (data.ripcordDetails ?? []).join(', ')
    return {
      ripcord,
      ripcordAsInt,
      message: `Ripcord indicator true. Details: ${ripcordDetails}`,
    }
  }

  return { ripcord, ripcordAsInt }
}
