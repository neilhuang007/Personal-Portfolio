# GitHub Stats Sync Setup

This document explains how to set up automatic syncing of your GitHub statistics to your portfolio.

## Overview

The sync system:
- Fetches all your repositories (public AND private)
- Calculates lines of code, commits, and language statistics
- Updates `info/projects.json`, `info/resume.json`, and `info/github-stats.json`
- Runs automatically via GitHub Actions (daily + on push)

## Setup Instructions

### Step 1: Create a Personal Access Token (PAT)

1. Go to [GitHub Settings > Developer Settings > Personal Access Tokens](https://github.com/settings/tokens)
2. Click **"Generate new token (classic)"**
3. Give it a name like `Portfolio Sync`
4. Set expiration (recommend: 90 days, then rotate)
5. Select these scopes:
   - `repo` - Full control of private repositories
   - `read:user` - Read all user profile data
6. Click **"Generate token"**
7. **Copy the token immediately** (you won't see it again!)

### Step 2: Add Token as GitHub Secret

1. Go to your portfolio repository on GitHub
2. Click **Settings** > **Secrets and variables** > **Actions**
3. Click **"New repository secret"**
4. Name: `PORTFOLIO_GITHUB_TOKEN`
5. Value: Paste your token
6. Click **"Add secret"**

### Step 3: Trigger the Workflow

The sync runs automatically:
- **Daily** at midnight UTC
- **On push** to master (only if sync files changed)
- **Manually** via Actions tab > "Sync GitHub Stats" > "Run workflow"

## Manual Trigger Options

### Via GitHub Web UI
1. Go to Actions tab in your repository
2. Select "Sync GitHub Stats" workflow
3. Click "Run workflow"

### Via GitHub CLI
```bash
gh workflow run sync-github-stats.yml
```

### Via API (for AI/automation)
```bash
curl -X POST \
  -H "Authorization: token YOUR_GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/neilhuang007/Personal-Portfolio/actions/workflows/sync-github-stats.yml/dispatches \
  -d '{"ref":"master"}'
```

## Local Development

If you want to run the sync locally:

1. Create a `.env` file in the project root:
   ```
   GITHUB_TOKEN=ghp_your_token_here
   ```

2. Run the sync:
   ```bash
   # Windows
   sync-github.bat

   # Or directly with Node
   node scripts/github-sync.js
   ```

## Data Files Updated

| File | Description |
|------|-------------|
| `info/projects.json` | Project list with stars, forks, last updated |
| `info/resume.json` | Stats section (lines, commits, languages) |
| `info/github-stats.json` | Full GitHub data for AI access |

## AI Access

The `info/github-stats.json` file is specifically designed for AI assistants to access your GitHub data. It includes:

- Complete repository list with all metadata
- Language breakdown with byte counts and percentages
- Commit counts per repository
- Profile information
- Last sync timestamp

AI tools like Claude Code can read this file to provide accurate, up-to-date information about your projects without needing to make API calls.

## Troubleshooting

### Sync not running?
- Check Actions tab for workflow errors
- Verify the secret name is exactly `PORTFOLIO_GITHUB_TOKEN`
- Ensure the token hasn't expired

### Private repos not showing?
- The token needs `repo` scope (not just `public_repo`)
- Check if the token was created with the correct permissions

### Rate limited?
- Authenticated requests get 5,000/hour (vs 60/hour unauthenticated)
- The script handles pagination efficiently

## Security Notes

- Never commit your token to the repository
- The `.env` file is gitignored
- GitHub Secrets are encrypted and not visible in logs
- Rotate your token periodically (every 90 days recommended)
