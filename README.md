# Freelancermap Watcher

A tool to monitor freelancermap for new projects matching specific technologies or locations, and send email notifications when new projects are found.

## Features

- Monitor freelancermap for specific technologies (e.g., React, Node.js, Java, etc.)
- Filter by location preferences (remote, hybrid, on-site)
- Geographic filtering (DACH region or specific cities with radius)
- Automatic email notifications for new projects
- Configurable search intervals (default: every 5 minutes)

## Requirements

- Node.js (see .nvmrc for specific version)
- Gmail account with OAuth 2.0 credentials

## Installation

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

## Configuration

### Gmail OAuth 2.0 Setup

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

### Configuring Fetchers

Create / edit `fetchers.json` to set up your search criteria. Each entry represents a different search:

```json
{
  "name": "Search Name",
  "query": "search terms OR 'phrase search'",
  "location": {
    "remote": true|false,
    "hybrid": true|false,
    "onSite": true|false
  },
  "dach": true|false,
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
- `city`: Optional - specify a city name and search radius in kilometers

## Usage

Start the application:

```
npm start
```

The application will:

1. Send a test email to verify email configuration
2. Start fetching projects according to your configuration
3. Monitor for new projects every 5 minutes
4. Send email notifications when new projects are found

## Building for Production

Compile the TypeScript code:

```
npm run build
```

The compiled JavaScript will be available in the `dist` directory.

## License

ISC
