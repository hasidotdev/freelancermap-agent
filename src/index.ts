import { Fetcher } from "./Fetcher"
import { Notifier } from "./Notifier"
import fetchData from "../fetchers.json"

import dotenv from "dotenv"
dotenv.config()

let fetchers: Fetcher[] = []
try {
  fetchers = fetchData.map((fetcher) => new Fetcher(fetcher.name, fetcher.query, fetcher.location, fetcher.dach, fetcher.city))
} catch (error) {
  console.error("Error loading fetchers.json:", error)
  process.exit(1)
}

const notifier = new Notifier()

// notifier.testMail().then(() => {
//   console.log("Test email sent successfully!")
// })

for (const fetcher of fetchers) {
  fetcher.run((projects) => {
    console.log(`Found ${projects.length} projects`)
    notifier.notify(projects, fetcher.name)
  })
}
