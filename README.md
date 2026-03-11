# Freelancermap Watcher & MCP-Server

Two tools in one:

1. **MCP Server** — Let AI assistants (Claude, Copilot, …) search [freelancermap.at](https://www.freelancermap.at) interactively.
2. **Email Watcher** — A background process that polls for new projects and sends email notifications.

---

## MCP Server

Expose freelancermap.at search as MCP tools so any compatible AI assistant can query it on demand — no config files required.

### Tools

- **`search_projects`** — Search for projects. Pass all desired terms (including synonyms) in the `terms` array; they are OR-combined into a single query. Supports remote/hybrid/on-site filter, DACH region, and city+radius.
- **`get_project_detail`** — Fetch full details (description, skills, start date, duration, workload, budget) for a single project by its numeric ID.

### Setup

```bash
npm install
npm run build
```

#### Claude Code (user-wide)

**macOS / Linux:**
```bash
claude mcp add --scope user --transport stdio freelancermap -- node /absolute/path/to/freelancermap-watcher/dist/freelancermap-mcp.js
```

**Windows:**
```cmd
claude mcp add --scope user --transport stdio freelancermap -- node C:\absolute\path\to\freelancermap-watcher\dist\freelancermap-mcp.js
```

#### Claude Desktop

Edit the config file for your OS:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "freelancermap": {
      "command": "node",
      "args": ["/absolute/path/to/freelancermap-watcher/dist/freelancermap-mcp.js"]
    }
  }
}
```

On Windows, use a Windows-style path in `args`: `"C:\\absolute\\path\\to\\freelancermap-watcher\\dist\\freelancermap-mcp.js"`

Restart the app after saving.

#### GitHub Copilot CLI

Edit the config file for your OS:

- **macOS / Linux:** `~/.copilot/mcp-config.json`
- **Windows:** `%USERPROFILE%\.copilot\mcp-config.json`

```json
{
  "mcpServers": {
    "freelancermap": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/freelancermap-watcher/dist/freelancermap-mcp.js"]
    }
  }
}
```

On Windows, use a Windows-style path in `args`: `"C:\\absolute\\path\\to\\freelancermap-watcher\\dist\\freelancermap-mcp.js"`

Alternatively, run `/mcp add` interactively within Copilot CLI and choose `stdio`.

---

## Email Watcher

A long-running Node.js/TypeScript process that polls the freelancermap.at API and sends email notifications for new projects.

### Features

- Monitor freelancermap for specific technologies (e.g., React, Node.js, Java, etc.)
- Filter by location preferences (remote, hybrid, on-site)
- Geographic filtering (DACH region or specific cities with radius)
- Automatic email notifications for new projects
- Configurable search intervals (default: every 10 minutes)

### Requirements

- Node.js (see .nvmrc for specific version)
- Gmail account with OAuth 2.0 credentials

### Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a copy of the environment variables file:
   ```
   cp .env.sample .env
   ```
4. Create a copy of the fetchers configuration file:
   ```
   cp fetchers-sample.json fetchers.json
   ```

### Configuration

#### Gmail OAuth 2.0 Setup

1. Create a Google Cloud project
2. Enable the Gmail API
3. Configure OAuth 2.0 consent screen
4. Create OAuth 2.0 credentials (Client ID and Client Secret)
5. Generate a refresh token using the OAuth 2.0 playground

Fill these values in your `.env` file (create from `.env.sample`):

```
GMAIL_USER=your.email@gmail.com
GMAIL_OAUTH_CLIENT_ID=your-oauth-client-id
GMAIL_OAUTH_CLIENT_SECRET=your-oauth-client-secret
GMAIL_OAUTH_REFRESH_TOKEN=your-oauth-refresh-token
RECIPIENT_EMAIL=recipient@example.com
```

#### Configuring Fetchers

Create / edit `fetchers.json` to set up your search criteria. Each entry represents a different search:

```json
{
  "name": "Search Name",
  "query": "search terms OR 'phrase search'",
  "location": {
    "remote": true,
    "hybrid": false,
    "onSite": false
  },
  "dach": true,
  "city": {
    "name": "City Name",
    "radius": "distance-in-km"
  }
}
```

Parameters:

- `name`: Identifier for this search
- `query`: Search terms (supports OR operator and quoted phrases)
- `location`: Filter for remote work, hybrid, or on-site positions
- `dach`: Limit to Germany (DE), Austria (AT), and Switzerland (CH)
- `city`: Optional — specify a city name and search radius in kilometers

### Usage

```
npm start
```

The application will:

1. Send a test email to verify email configuration
2. Start fetching projects according to your configuration
3. Monitor for new projects every 10 minutes
4. Send email notifications when new projects are found

---

## Building

```bash
npm run build
```

The compiled JavaScript will be available in the `dist` directory.

## License

ISC
