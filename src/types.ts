export interface Country {
  id: number
  name: string
  iso2: string
  nameDe: string
  nameEn: string
}

export interface Poster {
  id: number
  salutation: string
  firstName: string
  lastName: string
  username: string
  company: string
  country: Country
  membership: number
  accountType: string
  zip: string
  city: string
  website: string
}

export interface Industry {
  id: number
  nameDe: string
  nameEn: string
}

export interface ProjectContractType {
  type: string
  remoteInPercent: number
}

export interface User {
  is_premium: boolean
}

export interface MatchingLocalized {
  de: string
  en: string
}

export interface Matching {
  titleLocalized: MatchingLocalized[]
  titleIds: string[]
  keywordsLocalized: MatchingLocalized[] // Assuming similar structure, might need adjustment if different
  keywordIds: string[] // Assuming similar structure, might need adjustment if different
  textLocalized: MatchingLocalized[]
  textIds: string[]
  mainCategories: Record<string, number> // e.g., { id1: 0.83, ... }
  subCategories: Record<string, number> // e.g., { id1: 7, ... }
  allIds: string[]
}

export interface LinksLocation {
  remote: string
  city: string
  locations: string[] // Assuming array of strings, might need adjustment
  country: string
}

export interface Links {
  company: {
    name: string
    url: string
  }
  project: string
  location: LinksLocation
}

export interface Image {
  initials: string
}

export interface Skill {
  de: string
  en: string
}

export interface Project {
  id: number
  slug: string
  subCategories: any[] // Type based on actual data if available
  country: Country
  locations: any[] // Type based on actual data if available
  poster: Poster
  company: string
  firstName: string
  lastName: string
  created: string // ISO 8601 date string
  updated: number // Timestamp
  title: string
  description: string
  city: string
  plink: string | null
  url: string | null
  expires: number // Timestamp
  contractType: string | null // Or a more specific type if possible
  beginningMonth: number | null
  beginningYear: number | null
  duration: number | null
  verlaengerung: number
  beginningText: string
  durationText: string | null
  topProject: any | null // Type based on actual data if available
  budget: any | null // Type based on actual data if available
  industry: Industry
  projectContractType: ProjectContractType
  user: User
  endcustomer: boolean
  pid: any | null // Type based on actual data if available
  matching: Matching
  generatedMainCategories: number[]
  links: Links
  image: Image
  translations: any[] // Type based on actual data if available
  memoListStatus: any | null // Type based on actual data if available
  skills: Skill[]
}

export interface FreelancerMapResponse {
  projects: Project[]
  // Add other potential top-level fields from the response if known
}
