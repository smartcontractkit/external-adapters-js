export const toNumber = (s?: string | number) => {
  const num = Number(s)
  return isNaN(num) ? undefined : num
}
