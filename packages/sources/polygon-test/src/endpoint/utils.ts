//  URL Encoding
export const charsToEncode = {
  ':': '%3A',
  '/': '%2F',
  '?': '%3F',
  '#': '%23',
  '[': '%5B',
  ']': '%5D',
  '@': '%40',
  '!': '%21',
  $: '%24',
  '&': '%26',
  "'": '%27',
  '(': '%28',
  ')': '%29',
  '*': '%2A',
  '+': '%2B',
  ',': '%2C',
  ';': '%3B',
  '=': '%3D',
  '%': '%25',
  ' ': '%20',
  '"': '%22',
  '<': '%3C',
  '>': '%3E',
  '{': '%7B',
  '}': '%7D',
  '|': '%7C',
  '^': '%5E',
  '`': '%60',
  '\\': '%5C',
}

const stringHasWhitelist = (str: string, whitelist: string[]): boolean =>
  whitelist.some((el) => str.includes(el))

const percentEncodeString = (str: string, whitelist: string[]): string =>
  str
    .split('')
    .map((char) => {
      const encodedValue = charsToEncode[char as keyof typeof charsToEncode]
      return encodedValue && !whitelist.includes(char) ? encodedValue : char
    })
    .join('')

export const buildUrlPath = (pathTemplate = '', params = {}, whitelist = ''): string => {
  const allowedChars = whitelist.split('')

  for (const param in params) {
    const value = params[param as keyof typeof params]
    if (!value) continue

    // If string contains a whitelisted character: manually replace any non-whitelisted characters with percent encoded values. Otherwise, encode the string as usual.
    const encodedValue = stringHasWhitelist(value, allowedChars)
      ? percentEncodeString(value, allowedChars)
      : encodeURIComponent(value)

    pathTemplate = pathTemplate.replace(`:${param}`, encodedValue)
  }

  return pathTemplate
}
