function getMaxColumnChars(tableText: string[][], numCols: number) {
  return tableText.reduce(
    (maxCharsArr, row) => maxCharsArr.map((maxChars, i) => Math.max(maxChars, row[i].length)),
    Array(numCols).fill(0),
  )
}

function padText(text: string, padLength: number) {
  const halfPadLength = padLength / 2
  const prePadding = ' '.repeat(Math.floor(halfPadLength))
  const postPadding = ' '.repeat(Math.ceil(halfPadLength))
  return prePadding + text + postPadding
}

function getPaddedText(tableText: string[][], maxColumnChars: number[]) {
  return tableText.map((row) =>
    row.map((str, i) => {
      let padLen = maxColumnChars[i] - str.length
      if (str === '✅') padLen -= 1 //Subtract 1 since ✅ takes up 2 spaces but counts as 1 char
      return padText(str, padLen)
    }),
  )
}

function getSeparatorRow(maxColumnChars: number[]) {
  return maxColumnChars.map((n) => `:${'-'.repeat(n - 2)}:`)
}

function getTableString(paddedText: string[][]) {
  return paddedText.reduce((str, row, i) => {
    if (i != 0) str += '\n'
    str += `| ${row.join(' | ')} |`
    return str
  }, '')
}

export function buildTable(tableText: string[][], headers: stringp[]): string {
  tableText = [headers, ...tableText]

  const maxColumnChars = getMaxColumnChars(tableText, headers.length)

  const paddedText = getPaddedText(tableText, maxColumnChars)

  const separatorRow = getSeparatorRow(maxColumnChars) // Assumes each col has at least a 2-char max length
  paddedText.splice(1, 0, separatorRow)

  const tableString = getTableString(paddedText)

  return tableString
}
