import { SSEParser } from '../../src/transport/sse'

describe('SSEParser - Coinpaprika State Messages', () => {
  let parser: SSEParser
  let mockOnEvent: jest.Mock

  beforeEach(() => {
    mockOnEvent = jest.fn()
    parser = new SSEParser('t_s', mockOnEvent)
  })

  it('should parse standard coinpaprika-state message', () => {
    const chunk =
      'data: {"block_time":1761192245,"send_timestamp":1761192248,"base_token_symbol":"LUSD","quote_symbol":"USD","volume_7d_usd":152457.672726,"market_depth_plus_1_usd":46067.488432,"market_depth_minus_1_usd":57854.860019,"state_price":1.001045}\nevent: t_s\n\n'

    parser.push(chunk)

    expect(mockOnEvent).toHaveBeenCalledTimes(1)
    expect(mockOnEvent).toHaveBeenCalledWith(
      't_s',
      '{"block_time":1761192245,"send_timestamp":1761192248,"base_token_symbol":"LUSD","quote_symbol":"USD","volume_7d_usd":152457.672726,"market_depth_plus_1_usd":46067.488432,"market_depth_minus_1_usd":57854.860019,"state_price":1.001045}',
    )
  })

  it('should parse error message without breaking', () => {
    const chunk = 'data: {"message":"unsupported CBBTC-USD asset"}\nevent: error\n\n'

    parser.push(chunk)

    expect(mockOnEvent).toHaveBeenCalledTimes(1)
    expect(mockOnEvent).toHaveBeenCalledWith('error', '{"message":"unsupported CBBTC-USD asset"}')
  })

  it('should handle non standard, non-error message without breaking', () => {
    const chunk = 'data: {"nodata": 0}\nevent: different-type\n\n'

    parser.push(chunk)

    expect(mockOnEvent).toHaveBeenCalledTimes(1)
    expect(mockOnEvent).toHaveBeenCalledWith('different-type', '{"nodata": 0}')
  })
})
