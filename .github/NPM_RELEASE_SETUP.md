# NPM Release Setup Guide

⚠️ **CRITICAL: You MUST use an NPM Automation Token, NOT a regular token!**

If you get an `EOTP` error (one-time password required) when publishing, it means you're using a regular token. NPM accounts with 2FA enabled **REQUIRE** Automation tokens for CI/CD publishing.

This document explains how to set up NPM package publication for this repository.

## Prerequisites

- Admin access to the GitHub repository
- NPM account with publish rights to the `dart-pub-mcp` package

## Setting up NPM_TOKEN Secret

The release workflow requires an NPM Automation Token to publish packages. This is important because:

1. **Automation tokens bypass 2FA** - Regular NPM tokens require OTP (one-time password) for accounts with 2FA enabled, but automation tokens don't
2. **CI/CD compatibility** - Automation tokens are specifically designed for automated publishing workflows
3. **Provenance support** - The workflow uses `--provenance` flag which requires proper token configuration

### Steps to Create an NPM Automation Token

1. **Log in to npmjs.com**
   - Go to https://www.npmjs.com
   - Sign in to your account

2. **Navigate to Access Tokens**
   - Click on your profile picture (top right)
   - Select "Access Tokens" from the dropdown

3. **Generate New Token**
   - Click "Generate New Token"
   - **CRITICAL:** Select "**Automation**" as the token type
     - ❌ NOT "Classic" 
     - ❌ NOT "Granular"
     - ✅ ONLY "Automation"
   - Give it a descriptive name like "GitHub Actions - dart-pub-mcp"
   - Click "Generate Token"

4. **Copy the Token**
   - Copy the generated token immediately
   - You won't be able to see it again after closing the dialog

5. **Add Token to GitHub Secrets**
   - Go to your GitHub repository
   - Navigate to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Paste the automation token you copied
   - Click "Add secret"

## How the Workflow Uses the Token

The release workflow (`.github/workflows/release.yml`) is configured to:

1. Set up Node.js with the NPM registry URL
2. Use the `NODE_AUTH_TOKEN` environment variable (automatically configured by `setup-node` action)
3. Publish with provenance for supply chain security
4. Publish with public access

## Triggering a Release

### Automatic Publishing (Recommended)

1. Create a new release on GitHub:
   - Go to Releases → Draft a new release
   - Create or select a tag (e.g., `v0.1.2`)
   - Fill in release notes
   - Click "Publish release"
2. The workflow will automatically build and publish to NPM

### Manual Publishing

1. Go to Actions → Release workflow
2. Click "Run workflow"
3. Select the branch
4. Set "publish" input to "true"
5. Click "Run workflow"

## Troubleshooting

### Error: ENEEDAUTH

This error occurs when the authentication token is not properly configured. Make sure:
- The `NPM_TOKEN` secret is set in GitHub
- You're using an **Automation** token, not a Classic token

### Error: EOTP (One-Time Password Required)

**This is the most common error!** This error means you're using a regular token instead of an automation token. 

**Solution:**
1. Delete your current NPM_TOKEN secret from GitHub
2. Go to npmjs.com and delete the old token
3. Create a NEW token and make absolutely sure you select **"Automation"** as the type
4. Add the new automation token as NPM_TOKEN secret in GitHub

⚠️ **Remember:** 
- Automation tokens are specifically designed for CI/CD
- Regular tokens (Classic/Granular) will ALWAYS fail with EOTP error if 2FA is enabled
- You cannot convert a regular token to an automation token - you must create a new one

NPM accounts with 2FA enabled require automation tokens for CI/CD. Follow the steps above to create a proper automation token.

### Workflow Not Triggering

- Make sure you're creating a GitHub Release (not just a tag)
- The workflow only triggers on release publication, not on draft creation

## Security Best Practices

1. **Never commit tokens** to the repository
2. **Use automation tokens** for CI/CD (not classic tokens)
3. **Rotate tokens periodically** for better security
4. **Enable provenance** to verify package authenticity
5. **Review permissions** - automation tokens should only have publish permissions

## More Information

- [NPM Automation Tokens Documentation](https://docs.npmjs.com/creating-and-viewing-access-tokens#creating-automation-tokens)
- [GitHub Actions Setup Node Documentation](https://github.com/actions/setup-node#publish-to-npmjs)
- [NPM Provenance Documentation](https://docs.npmjs.com/generating-provenance-statements)
