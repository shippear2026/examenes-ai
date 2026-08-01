import { GuidedStudy } from "@/components/guided-study";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-2 px-5 py-4">
          <span className="text-xl font-bold tracking-tight text-primary">
            ExamenIA
          </span>
          <span className="text-lg text-muted-foreground">· tu ayudante para estudiar</span>
        </div>
      </header>

      <main className="flex flex-1 flex-col px-5 py-10 sm:py-16">
        <GuidedStudy />
      </main>

      <footer className="border-t border-border py-5 text-center text-base text-muted-foreground">
        Hecho para que estudiar sea fácil
      </footer>
    </div>
  );
}
