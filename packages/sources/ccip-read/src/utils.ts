import { Fragment, Interface, JsonFragment } from '@ethersproject/abi'

export const toInterface = (
  abi: string | readonly (string | Fragment | JsonFragment)[] | Interface,
): Interface => {
  return Interface.isInterface(abi) ? abi : new Interface(abi)
}
