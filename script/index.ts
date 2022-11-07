import axios from 'axios'
import path from 'node:path'
import fs from 'node:fs/promises'

const DATA_URL = 'https://api.cryptoscamdb.org/v1/scams'

export type Response = {
  success: boolean
  result: Array<Site>
}
interface Site {
  id: string
  name: string
  url: string
  path: string
  category: string
  subcategory: string
  description: string
  reporter: string
}

// @ts-ignore
const outputDir = path.join(process.env.PWD, 'providers/CryptoscanDB')
export async function writeWebsiteToFile(website: string, data: Site) {
  await fs.writeFile(path.join(outputDir, `${website?.toLowerCase()}.json`), JSON.stringify(data), {
    encoding: 'utf-8',
  })
}

async function main() {
  const result = await axios.get<Response>(DATA_URL)
  if (!result.data.success) {
    console.log('Fetch db data from API failed!')
    return
  }
  const list = result.data.result
    for (const site of list) {
        await writeWebsiteToFile(site.name, site)
    }
}

main()
