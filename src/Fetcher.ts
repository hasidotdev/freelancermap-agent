import axios from "axios"
import type { AxiosRequestConfig } from "axios"
import { URLSearchParams } from "url"
import { FreelancerMapResponse, Project } from "./types" // Import interfaces

export class Fetcher {
  private readonly url = "https://www.freelancermap.at/project/search/ajax"

  private readonly interval = 1000 * 60 * 2 // 1 minute

  private mostRecentProjectTimestamp?: number

  public readonly name: string

  private readonly params = {
    projectContractTypes: ["contracting", "employee_leasing"],
    remoteInPercent: [] as string[],
    query: "",
    countries: [] as string[],
    sort: "1",
    pagenr: "1",
    city: undefined as string | undefined,
    radius: undefined as string | undefined,
  }

  private readonly cookies = {}

  private readonly headers = {
    accept: "*/*",
    "accept-language": "en-US,en;q=0.9,de-DE;q=0.8,de;q=0.7",
    "cache-control": "no-cache",
    "content-type": "application/json",
    dnt: "1",
    origin: "https://www.freelancermap.at",
    pragma: "no-cache",
    priority: "u=1, i",
    referer: "https://www.freelancermap.at/projektboerse.html",
  }

  public constructor(
    name: string,
    query: string,
    location: { remote: boolean; hybrid: boolean; onSite: boolean },
    dach: boolean,
    city?: {
      name: string
      radius: string
    }
  ) {
    this.params.query = query
    this.name = name
    if (location.remote) {
      this.params.remoteInPercent.push("100")
    }
    if (location.hybrid) {
      this.params.remoteInPercent.push("1")
    }
    if (location.onSite) {
      this.params.remoteInPercent.push("0")
    }
    if (dach) {
      this.params.countries = ["1", "2", "3"]
    }

    if (city) {
      this.params.city = city.name
      this.params.radius = city.radius
    }
  }

  private updateMostRecentProjectTimestamp(projects: Project[]): void {
    this.mostRecentProjectTimestamp = projects[0]?.updated
    console.log(`Fetcher ${this.name}: `, "Most recent project timestamp updated to:", new Date(this.mostRecentProjectTimestamp! * 1000).toISOString())
  }

  private processProjects(projects: Project[]): Project[] {
    console.log(`Fetcher ${this.name}: `, "Processing projects...")
    if (this.mostRecentProjectTimestamp === undefined) {
      this.updateMostRecentProjectTimestamp(projects)
      console.log(`Fetcher ${this.name}: `, "Initial run... No new projects shown.")
      return []
    }

    console.log(`Fetcher ${this.name}: `, "Most recent project timestamp:", this.mostRecentProjectTimestamp)
    console.log(
      `Fetcher ${this.name}: `,
      "Projects:",
      projects.map((p) => p.updated)
    )
    const newProjects = projects.filter((project) => project.updated > this.mostRecentProjectTimestamp!)

    console.log(
      `Fetcher ${this.name}: `,
      "New projects:",
      newProjects.map((p) => p.updated)
    )

    this.mostRecentProjectTimestamp = newProjects[0]?.updated

    console.log(`Found ${newProjects.length} new projects.`)
    return newProjects
  }

  prepareData = <T>() => {
    const searchParams = new URLSearchParams()
    Object.entries(this.params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item, index) => searchParams.append(`${key}[${index}]`, item))
      } else {
        if (value !== undefined) {
          searchParams.append(key, value)
        }
      }
    })

    const urlWithParams = `${this.url}?${searchParams.toString()}`

    const cookieString = Object.entries(this.cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join("; ")

    const config: AxiosRequestConfig<T> = {
      headers: {
        ...this.headers,
        cookie: cookieString,
      },
    }

    const data = {
      changed: ["query", "city", "radius", "states", "location", "countries", "continents", "sort"],
    }

    return { urlWithParams, config, data }
  }

  public doSingleFetch = async (): Promise<Project[]> => {
    try {
      const { urlWithParams, config, data } = this.prepareData<FreelancerMapResponse>()

      console.log(`Fetcher ${this.name}: `, "Fetching data from:", urlWithParams)
      const response = await axios.post<FreelancerMapResponse>(urlWithParams, data, config)

      console.log(`Fetcher ${this.name}: `, "Response Status:", response.status)

      if (response.data && response.data.projects) {
        console.log(`Fetched ${response.data.projects.length} projects.`)
        return response.data.projects
      } else {
        console.log(`Fetcher ${this.name}: `, "Response Data (structure might be unexpected):", response.data)
        return []
      }
    } catch (error: any) {
      console.error("Error fetching data:")
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Status:", error.response.status)
        console.error("Headers:", error.response.headers)
        console.error("Data:", error.response.data)
      } else if (error.request) {
        // The request was made but no response was received
        console.error("Request:", error.request)
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error Message:", error.message)
      }
      console.error("Config:", error.config)
    }
    throw new Error("Error fetching data")
  }

  public async run(onNewProjects: (projects: Project[]) => void): Promise<void> {
    console.log(`Fetcher ${this.name}: `, "Fetcher is running...")
    console.log(`Fetcher ${this.name}: `, "Waiting for first fetch...")
    const projects = await this.doSingleFetch()
    this.processProjects(projects)
    console.log(`Fetcher ${this.name}: `, `First fetch completed. Wating ${this.interval / 1000} seconds for next fetch...`)

    setInterval(async () => {
      console.log(`Fetcher ${this.name}: `, "Fetching data...")
      const projects = await this.doSingleFetch()
      const newProjects = this.processProjects(projects)
      console.log(`Fetcher ${this.name}: `, "Data fetched and processed.")
      console.log(`Fetcher ${this.name}: `, `Wating ${this.interval / 1000} seconds for next fetch...`)
      onNewProjects(newProjects)
    }, this.interval)
  }
}
