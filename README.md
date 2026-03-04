# PI-Rat

Home cloud and media solutions that runs even on a cutting board

## Usage

1. Clone the repository
1. Install the dependencies with `yarn`
1. Start the frontend and the backend service with `yarn start:frontend` and `yarn start:service` (check the NPM scripts for further details)

## Building

```bash
yarn build          # Full build (Monaco MFE + TypeScript + frontend Vite build)
yarn build:monaco-mfe  # Build only the Monaco editor MFE (only needed when monaco-mfe/ changes)
```

The Monaco editor is extracted into a separate Micro Frontend (`monaco-mfe/`) to keep the main frontend build fast (~2s). The MFE is pre-built and served as a static asset at runtime. See `monaco-mfe/` for details.

## Testing

- You can execute the example unit tests with `yarn test`
- You can execute E2E tests with `yarn test:e2e`

## Project Structure

```
pi-rat/
  common/       # Shared types, models, and API definitions
  frontend/     # Frontend application (Shades framework)
  service/      # Backend service
  monaco-mfe/   # Monaco editor Micro Frontend (separate build)
  e2e/          # End-to-end tests (Playwright)
```

## Docker

```bash
yarn dockerize      # Build the Docker image
```
