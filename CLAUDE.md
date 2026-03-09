# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Run with ts-node (development)
npm run build      # Compile TypeScript to dist/
```

Node version: v23.9.0 (`.nvmrc`)

## Configuration

Two files must be present (not committed):
- `.env` — Gmail OAuth credentials and recipient email (copy from `.env.sample`)
- `fetchers.json` — Array of search configurations (copy from `fetchers-sample.json`)

## Architecture

This project has two modes:

### 1. MCP Server (`freelancermap-mcp.ts`)

Exposes freelancermap.at search to AI assistants (Claude Code, Claude Desktop, VS Code Copilot) via the [Model Context Protocol](https://modelcontextprotocol.io). No config files needed — tools are called on-demand.

**Tools:**
- `search_projects` — Search projects; terms are OR-combined. Supports remote/hybrid/on-site, DACH filter, city+radius.
- `get_project_detail` — Fetch full details (description, skills, start, duration, budget) by numeric project ID.

**Setup:**
```bash
npm run build
claude mcp add --scope user --transport stdio freelancermap -- node /absolute/path/to/dist/freelancermap-mcp.js
```

### 2. Email Watcher (`index.ts`)

A long-running process that polls the freelancermap.at API and sends email notifications for new projects.

**Flow:**
1. `index.ts` loads `fetchers.json`, creates one `Fetcher` per config entry and a shared `Notifier`
2. Each `Fetcher` polls `freelancermap.at/project/search/ajax` every 10 minutes via POST
3. New projects are identified by comparing the `updated` Unix timestamp against the most recently seen value
4. On first run, timestamps are initialized but no notifications are sent (avoids initial flood)
5. `Notifier` sends HTML-formatted emails via nodemailer with Gmail OAuth 2.0

**Key files:**
- `src/index.ts` — Entry point, wires everything together
- `src/Fetcher.ts` — API polling, timestamp-based deduplication, error handling; also used by MCP server
- `src/Notifier.ts` — Gmail OAuth email sending
- `src/freelancermap-mcp.ts` — MCP server entry point
- `src/types.ts` — TypeScript interfaces for the freelancermap API response
- `fetchers-sample.json` — Config template showing available search fields (query, location, dach, city/radius)
