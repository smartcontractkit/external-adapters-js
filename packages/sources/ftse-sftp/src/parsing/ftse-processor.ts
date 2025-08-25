import { FTSE100Parser, FTSE100Data } from './ftse100'

/**
 * Example usage for FTSE CSV parsing
 */
export class FTSEDataProcessor {
  private parser: FTSE100Parser

  constructor() {
    this.parser = new FTSE100Parser()
  }

  /**
   * Parse FTSE CSV and extract the essential fields you need
   */
  async parseEssentialFields(csvContent: string): Promise<Array<{
    indexCode: string,
    noCons: number | null,
    indexGBP: number | null,
    triGBP: number | null
  }>> {
    const fullData = await this.parser.parse(csvContent)
    return this.parser.getEssentialData(fullData)
  }

  /**
   * Parse and get full FTSE data
   */
  async parseFullData(csvContent: string): Promise<FTSE100Data[]> {
    return await this.parser.parse(csvContent)
  }

  /**
   * Filter data by specific criteria
   */
  async parseAndFilter(csvContent: string, minIndexValue?: number): Promise<FTSE100Data[]> {
    const data = await this.parser.parse(csvContent)
    
    return data.filter(item => {
      // Filter out invalid entries
      if (!item.indexCode || item.indexGBP === null) {
        return false
      }
      
      // Apply minimum index value filter if provided
      if (minIndexValue !== undefined && (item.indexGBP || 0) < minIndexValue) {
        return false
      }
      
      return true
    })
  }

  /**
   * Get summary statistics from FTSE data
   */
  async getDataSummary(csvContent: string): Promise<{
    totalRecords: number,
    validRecords: number,
    averageIndexGBP: number,
    averageTRIGBP: number,
    topPerformers: Array<{ indexCode: string, indexGBP: number | null }>
  }> {
    const data = await this.parser.parse(csvContent)
    
    const validRecords = data.filter(item => 
      item.indexCode && item.indexGBP !== null && item.triGBP !== null
    )

    const avgIndexGBP = validRecords.reduce((sum, item) => sum + (item.indexGBP || 0), 0) / validRecords.length
    const avgTRIGBP = validRecords.reduce((sum, item) => sum + (item.triGBP || 0), 0) / validRecords.length

    const topPerformers = validRecords
      .sort((a, b) => (b.indexGBP || 0) - (a.indexGBP || 0))
      .slice(0, 5)
      .map(item => ({ indexCode: item.indexCode, indexGBP: item.indexGBP }))

    return {
      totalRecords: data.length,
      validRecords: validRecords.length,
      averageIndexGBP: avgIndexGBP,
      averageTRIGBP: avgTRIGBP,
      topPerformers
    }
  }

  /**
   * Validate CSV format before processing
   */
  validateCSVFormat(csvContent: string): boolean {
    return this.parser.validateFormat(csvContent)
  }
}

// Example usage with your sample data:
/*
const processor = new FTSEDataProcessor()

// Sample CSV content (your data with proper tab separators)
const sampleCSV = `Index Code	Index/Sector Name	No. Cons	Index (GBP)	Index (EUR)	TRI (GBP)	TRI (EUR)	XD adj today	XD adj YTD	Mcap (GBP)	Mcap (EUR)	Actual Div Yld	Net Cover	P/E Ratio	Index % chg	TRI % chg	% wgt (All-share)
AS0	FTSE All-Small Index	234	5013.94546983	4527.16678648	11963.78128893	10802.27808975	0.00	122.23	39475.821910	45730.924721	3.88	0.51	50.58	0.45	0.45	1.54
AS0X	FTSE All-Small ex Inv Co Index	122	4576.77219240	4132.43645815	11210.35485402	10121.99802833	0.00	112.88	18680.032383	21639.958673	3.80	0.28	95.25	0.42	0.42	0.73
ASX	FTSE All-Share Index	543	4963.21445290	4481.36098818	11313.29192658	10214.94145956	0.00	126.69	2565765.418516	2972321.272390	3.37	1.53	19.34	0.18	0.18	100.00`

async function example() {
  // Get essential fields only
  const essentialData = await processor.parseEssentialFields(sampleCSV)
  console.log('Essential Data:', essentialData)
  
  // Get full data
  const fullData = await processor.parseFullData(sampleCSV)
  console.log('Full Data:', fullData)
  
  // Get summary
  const summary = await processor.getDataSummary(sampleCSV)
  console.log('Summary:', summary)
}
*/
