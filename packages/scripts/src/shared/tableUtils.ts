type MaxColChars = number[]
export type TableText = string[][]
export type TextRow = string[]

function getMaxColChars(tableText: TableText, numCols: number): MaxColChars {
  return tableText.reduce(
    (maxCharsArr: MaxColChars, row) =>
      maxCharsArr.map((maxChars, i) => Math.max(maxChars, row[i].length)),
    Array(numCols).fill(0),
  )
}

function padText(text: string, padLength: number): string {
  const halfPadLength = padLength / 2
  const prePadding = ' '.repeat(Math.floor(halfPadLength))
  const postPadding = ' '.repeat(Math.ceil(halfPadLength))
  return prePadding + text + postPadding
}

function getPaddedText(tableText: TableText, maxColChars: MaxColChars): TableText {
  return tableText.map((row) =>
    row.map((str, i) => {
      let padLen = maxColChars[i] - str.length
      if (str === '✅') padLen -= 1 // Subtract 1 since ✅ takes up 2 spaces but counts as 1 char
      return padText(str, padLen)
    }),
  )
}

function getSeparatorRow(maxColChars: MaxColChars): TextRow {
  return maxColChars.map((n) => `:${'-'.repeat(n - 2)}:`) // Assumes each col has at least a 2-char max length
}

function getTableString(paddedText: TableText): string {
  return paddedText.reduce((str, row, i) => {
    if (i !== 0) str += '\n'
    str += `| ${row.join(' | ')} |`
    return str
  }, '')
}

export function buildTable(tableText: TableText, headers: TextRow): string {
  tableText = [headers, ...tableText]

  const maxColChars = getMaxColChars(tableText, headers.length)

  const paddedText = getPaddedText(tableText, maxColChars)

  const separatorRow = getSeparatorRow(maxColChars)
  paddedText.splice(1, 0, separatorRow)

  const tableString = getTableString(paddedText)

  return tableString
}
