console.log = console.error

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z } from "zod"
import { Fetcher } from "./Fetcher"
import { Project, ProjectDetail } from "./types"

function buildQuery(terms: string[]): string {
  const quoted = terms.map(t =>
    t.startsWith("'") || !t.includes(" ") ? t : `'${t}'`
  )
  return quoted.join(" OR ")
}

function applyExclusions(projects: Project[], excludeTerms: string[]): Project[] {
  if (excludeTerms.length === 0) return projects
  const lower = excludeTerms.map(t => t.toLowerCase())
  return projects.filter(p => {
    const haystack = `${p.title} ${p.description ?? ""}`.toLowerCase()
    return !lower.some(t => haystack.includes(t))
  })
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString().split("T")[0]
}

function formatDetail(p: ProjectDetail): string {
  const skills = p.skills?.enabled?.map(s => s.nameEn || s.nameDe).filter(Boolean).join(", ") || "—"
  const locations = p.locations?.map(l => l.nameEn || l.nameDe).filter(Boolean).join(", ") || p.city || "—"
  const remote = p.contractType?.remoteInPercent ?? "?"

  const start = p.startYear && p.startMonth
    ? `${p.startYear}-${String(p.startMonth).padStart(2, "0")}`
    : p.startText || "—"
  const duration = p.durationInMonths
    ? `${p.durationInMonths} months${p.extensionPossible ? " (extendable)" : ""}`
    : p.durationText || "—"

  const lines: string[] = [
    `# ${p.title}`,
    `ID: ${p.id} | Created: ${p.created.split("T")[0]} | Updated: ${p.updated.split("T")[0]}`,
    `Company: ${p.company || "—"}`,
    `Location: ${locations} | Remote: ${remote}%`,
    `Start: ${start} | Duration: ${duration} | Workload: ${p.workload ?? "?"}%`,
    `Budget: ${p.budget ?? "—"}`,
    `Skills: ${skills}`,
    `URL: ${p.projectUrl}`,
    "",
    stripHtml(p.description ?? ""),
  ]

  return lines.join("\n")
}

function formatProjects(projects: Project[], queryString: string, excludedCount: number): string {
  const lines: string[] = [
    `Found ${projects.length} projects (${excludedCount} excluded)`,
    `Query: ${queryString}`,
    "",
  ]

  for (const p of projects) {
    const skillList = Array.isArray(p.skills)
      ? p.skills
      : (p.skills as any)?.enabled ?? []
    const skills = skillList.map((s: any) => s.en || s.nameEn || s.de || s.nameDe).filter(Boolean).join(", ") || "—"
    const remotePercent = p.projectContractType?.remoteInPercent ?? "?"
    const description = (p.description ?? "").slice(0, 100)
    const descSuffix = (p.description ?? "").length > 100 ? "..." : ""

    lines.push(`## ${p.title}`)
    lines.push(`ID: ${p.id} | Updated: ${formatDate(p.updated)}`)
    lines.push(`Location: ${p.city || "—"} | Remote: ${remotePercent}%`)
    lines.push(`Company: ${p.company || "—"}`)
    lines.push(`Skills: ${skills}`)
    lines.push(`URL: https://www.freelancermap.at/projekt/${p.slug}`)
    lines.push("")
    lines.push(`${description}${descSuffix}`)
    lines.push("---")
    lines.push("")
  }

  return lines.join("\n")
}

async function main() {
  const server = new McpServer({ name: "freelancermap", version: "1.0.0" })

  server.tool(
    "search_projects",
    "Search freelancermap.at for freelance projects. Terms are combined with OR. Include all desired synonyms/variants in the terms array.",
    {
      terms: z.array(z.string()).min(1).describe("Search terms (OR-combined). Include synonyms explicitly, e.g. [\"react\", \"react native\", \"nextjs\"]"),
      exclude_terms: z.array(z.string()).optional().default([]),
      remote: z.boolean().optional().default(true),
      hybrid: z.boolean().optional().default(false),
      on_site: z.boolean().optional().default(false),
      dach: z.boolean().optional().default(true),
      city_name: z.string().optional(),
      city_radius: z.string().optional().describe('Radius in km, e.g. "50"'),
    },
    async (params) => {
      const {
        terms,
        exclude_terms = [],
        remote = true,
        hybrid = false,
        on_site = false,
        dach = true,
        city_name,
        city_radius,
      } = params

      const queryString = buildQuery(terms)

      const city = city_name ? { name: city_name, radius: city_radius ?? "50" } : undefined

      const fetcher = new Fetcher(
        "mcp-search",
        queryString,
        { remote, hybrid, onSite: on_site },
        dach,
        city
      )

      const allProjects = await fetcher.doSingleFetch()
      const sorted = [...allProjects].sort((a, b) => b.updated - a.updated)
      const filtered = applyExclusions(sorted, exclude_terms)
      const excludedCount = sorted.length - filtered.length

      const text = formatProjects(filtered, queryString, excludedCount)

      return {
        content: [{ type: "text", text }],
      }
    }
  )

  server.tool(
    "get_project_detail",
    "Fetch full details for a single freelancermap.at project by its numeric ID.",
    {
      project_id: z.union([z.number().int(), z.string().regex(/^\d+$/).transform(Number)]).describe("The numeric project ID"),
    },
    async ({ project_id }) => {
      const detail = await Fetcher.getProjectDetail(project_id)
      const text = formatDetail(detail)
      return { content: [{ type: "text", text }] }
    }
  )

  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch(console.error)
