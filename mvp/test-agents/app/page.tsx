import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { AgentList } from "@/components/agent-list";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Agent Management Section */}
        <section className="container px-4 py-12 md:px-8">
          <AgentList />
        </section>

        {/* Hero Section */}
        <section className="container flex flex-col items-center justify-center gap-8 px-4 py-24 md:px-8 lg:py-32">
          <div className="flex max-w-4xl flex-col items-center gap-6 text-center">
            <div className="inline-flex items-center rounded-full border bg-muted px-4 py-1.5 text-sm">
              <span className="text-muted-foreground">InterRealm Foundation</span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Nexus MVP
            </h1>

            <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
              A powerful platform for building interconnected realms and managing distributed systems with ease.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Button size="lg" className="h-11 px-8">
                Get Started
              </Button>
              <Button size="lg" variant="outline" className="h-11 px-8">
                Learn More
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t bg-muted/50">
          <div className="container px-4 py-24 md:px-8 lg:py-32">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col gap-4 rounded-lg border bg-card p-6">
                <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold">Secure</h3>
                <p className="text-muted-foreground">
                  Built with security at its core, ensuring your realms and data are protected.
                </p>
              </div>

              <div className="flex flex-col gap-4 rounded-lg border bg-card p-6">
                <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                  >
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold">Scalable</h3>
                <p className="text-muted-foreground">
                  Scale from a single realm to thousands without breaking a sweat.
                </p>
              </div>

              <div className="flex flex-col gap-4 rounded-lg border bg-card p-6">
                <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                  >
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold">Developer Friendly</h3>
                <p className="text-muted-foreground">
                  Simple APIs and comprehensive documentation to get you started quickly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t">
          <div className="container flex flex-col items-center justify-center gap-8 px-4 py-24 text-center md:px-8 lg:py-32">
            <div className="flex max-w-2xl flex-col gap-4">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Ready to get started?
              </h2>
              <p className="text-lg text-muted-foreground">
                Join the InterRealm ecosystem and start building your interconnected realms today.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" className="h-11 px-8">
                Start Building
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="container flex flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row md:px-8">
          <p className="text-sm text-muted-foreground">
            © 2025 InterRealm Foundation. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Documentation
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              GitHub
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
