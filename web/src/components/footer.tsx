export function Footer() {
  return (
    <footer className="border-t py-6">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} DAC SkillX</span>
        <span>
          Powered by <span className="font-medium text-foreground">DAC</span>
        </span>
      </div>
    </footer>
  );
}
