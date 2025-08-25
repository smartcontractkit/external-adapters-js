import { CSVParserFactory, CSVParserType, FTSE100Data } from './index'
import { FTSEDataProcessor } from './ftse-processor'

/**
 * Example usage of the CSV parsing system for FTSE data
 */
export class CSVParsingService {
  
  /**
   * Parse FTSE CSV content and extract essential fields
   */
  async parseFTSEEssentials(csvContent: string): Promise<Array<{
    indexCode: string,
    noCons: number | null,
    indexGBP: number | null,
    triGBP: number | null
  }>> {
    const processor = new FTSEDataProcessor()
    return await processor.parseEssentialFields(csvContent)
  }

  /**
   * Parse FTSE CSV with the factory pattern
   */
  async parseFTSEWithFactory(csvContent: string): Promise<FTSE100Data[]> {
    const parser = CSVParserFactory.createParser(CSVParserType.FTSE100)
    return await parser.parse(csvContent) as FTSE100Data[]
  }

  /**
   * Auto-detect and parse CSV content
   */
  async parseAuto(csvContent: string): Promise<any[]> {
    const parser = CSVParserFactory.detectParser(csvContent)
    
    if (!parser) {
      throw new Error('No compatible parser found for the provided CSV content')
    }

    return await parser.parse(csvContent)
  }

  /**
   * Example: Process specific FTSE indices
   */
  async getSpecificIndices(csvContent: string, indexCodes: string[]): Promise<FTSE100Data[]> {
    const processor = new FTSEDataProcessor()
    const data = await processor.parseFullData(csvContent)
    
    return data.filter(item => indexCodes.includes(item.indexCode))
  }

  /**
   * Example: Get indices above certain value
   */
  async getHighValueIndices(csvContent: string, minValue: number): Promise<FTSE100Data[]> {
    const processor = new FTSEDataProcessor()
    return await processor.parseAndFilter(csvContent, minValue)
  }
}

// Practical example with your actual data structure:
/*
const service = new CSVParsingService()

// Your tab-separated FTSE data
const ftseData = `Index Code	Index/Sector Name	No. Cons	Index (GBP)	Index (EUR)	TRI (GBP)	TRI (EUR)	XD adj today	XD adj YTD	Mcap (GBP)	Mcap (EUR)	Actual Div Yld	Net Cover	P/E Ratio	Index % chg	TRI % chg	% wgt (All-share)
AS0	FTSE All-Small Index	234	5013.94546983	4527.16678648	11963.78128893	10802.27808975	0.00	122.23	39475.821910	45730.924721	3.88	0.51	50.58	0.45	0.45	1.54
ASX	FTSE All-Share Index	543	4963.21445290	4481.36098818	11313.29192658	10214.94145956	0.00	126.69	2565765.418516	2972321.272390	3.37	1.53	19.34	0.18	0.18	100.00`

async function example() {
  // Get just the 4 fields you need
  const essentials = await service.parseFTSEEssentials(ftseData)
  console.log('Index Code, No. Cons, Index GBP, TRI GBP:', essentials)
  
  // Get specific indices
  const specificIndices = await service.getSpecificIndices(ftseData, ['AS0', 'ASX'])
  
  // Get high-value indices
  const highValueIndices = await service.getHighValueIndices(ftseData, 5000)
}
*/
