# Nexus Console

Management console for InterRealm Nexus mesh configuration.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3002](http://localhost:3002) in your browser.

## Architecture

This console connects to the Nexus server API at `http://localhost:3001` and provides:

- JWT-based authentication with API tokens
- Mesh configuration visualization
- Realm tree exploration
- Member, bridge, and policy management

## Tech Stack

- Next.js 15.2
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Geist font
