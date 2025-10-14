# InterRealm MVP

A Turborepo monorepo containing the InterRealm MVP applications.

## What's inside?

This monorepo includes the following packages and apps:

### Apps

- `test-agents`: Next.js 15 application for the InterRealm MVP landing page

### Packages

- `@interrealm/ui`: Shared UI component library built with Radix UI and Tailwind CSS
  - Includes reusable components from the Nexus console
  - Theme provider and theme switcher components
  - Global styles with light/dark mode support

### Utilities

This Turborepo has some additional tools already setup:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 9.0.0

### Installation

Install dependencies using pnpm:

```bash
pnpm install
```

### Development

To run the test-agents app in development mode:

```bash
pnpm dev
```

The test-agents app will be available at [http://localhost:5000](http://localhost:5000)

### Building

To build all apps and packages:

```bash
pnpm build
```

### Linting

To lint all apps and packages:

```bash
pnpm lint
```

### Cleaning

To clean all build artifacts:

```bash
pnpm clean
```

## Project Structure

```
mvp/
├── apps/
│   └── test-agents/         # Next.js test-agents application
│       ├── app/             # App router pages
│       ├── components/      # Application-specific components
│       └── public/          # Static assets
├── packages/
│   ├── ui/                  # Shared UI component library
│   │   ├── src/
│   │   │   ├── button.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── theme-provider.tsx
│   │   │   ├── theme-switcher.tsx
│   │   │   ├── globals.css
│   │   │   └── lib/
│   │   │       └── utils.ts
│   │   └── package.json
│   └── config/              # Shared configuration (future)
├── package.json
├── turbo.json
└── pnpm-workspace.yaml
```

## Features

- **Next.js 15**: Latest Next.js with App Router
- **Turborepo**: Fast, efficient monorepo build system
- **Shared UI Library**: Reusable components across applications
- **Theme Support**: Light/dark mode with theme switcher
- **TypeScript**: Full type safety across the monorepo
- **Tailwind CSS v4**: Latest Tailwind with enhanced features
- **Radix UI**: Accessible, unstyled component primitives
- **Geist Font**: Beautiful typography with Geist Sans and Mono

## Learn More

To learn more about Turborepo and the technologies used:

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Radix UI](https://www.radix-ui.com)
