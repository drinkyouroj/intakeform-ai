import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold font-sans">IntakeForm.ai</h1>
        <p className="text-muted-foreground font-mono text-sm">Coming soon</p>
        <Button>Get Started</Button>
      </div>
    </main>
  );
}
