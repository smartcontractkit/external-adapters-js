import { Fragment, Interface, JsonFragment } from '@ethersproject/abi'

export const toInterface = (
  abi: string | readonly (string | Fragment | JsonFragment)[] | Interface,
) => {
  if (Interface.isInterface(abi)) {
    return abi
  }
  return new Interface(abi)
}
