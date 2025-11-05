# Contributing

Thanks for your interest in improving **dart-pub-mcp**! This project aims to make pub.dev and local pub cache data readily available via the Model Context Protocol. Contributions that improve stability, coverage, and usability are always welcome.

## Getting started

1. Fork the repository and clone your fork.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the test and type-check suites to ensure everything is working locally:
   ```bash
   npm run typecheck
   npm test
   ```
4. Use `npm run dev` for a file-watching development experience while iterating on the MCP server.

## Development workflow

- Keep changes focused and self-contained. If you are addressing multiple issues, prefer separate pull requests.
- Ensure new code paths have adequate test coverage. Vitest is configured for unit tests in `src/**/*.test.ts`.
- Run `npm run typecheck` followed by `npm test` before submitting a pull request.
- Update documentation (`README.md`, `AGENTS.md`, etc.) whenever behaviour or user-facing resources change.

## Commit & PR guidelines

- Write clear commit messages that explain the *why* behind the change.
- Reference related issues in your pull request description when applicable.
- Include screenshots or terminal output for changes that affect user interaction or workflows, when helpful.

## Releases & automation

- GitHub Actions includes a release workflow that builds the project, attaches packaged artefacts to GitHub releases, and publishes to npm.
- Configure repository secrets with an **npm automation token** (create via `Settings → Developer settings → Tokens → Generate automation token`) and store it as `NPM_TOKEN`. Automation tokens bypass OTP requirements so CI/CD can publish unattended.
- When triggering the workflow manually, pass `publish=true` if you want to perform the npm publish step; otherwise the workflow will skip it.

## Code style

- The project uses TypeScript in strict mode. Prefer explicit types when they aid readability, and lean on the existing helper utilities.
- Add concise comments only when context is not obvious from the code.
- Keep dependencies minimal—anything beyond the standard Node.js and existing libraries should have a clear justification.

## Reporting issues & requesting features

If you encounter a bug or have an idea for an enhancement, please open an issue with:

- A clear description of the problem or proposal.
- Steps to reproduce the bug (if applicable).
- Any relevant logs, stack traces, or screenshots.

We appreciate your help in making dart-pub-mcp better for the community!
