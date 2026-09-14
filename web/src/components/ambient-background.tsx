// Sitewide colorful backdrop — no cursor tracking, just a slow ambient
// drift (pure CSS keyframes), so it's cheap enough to mount once in the
// root layout and sit behind every page, including data-heavy ones. This
// is what makes the `.glass` panels throughout the app actually read as
// glass instead of just a translucent gray box: glass needs something
// colorful behind it to refract.
//
// The grain layer is a tiny tiled SVG noise texture over the whole page at
// a few percent opacity: it breaks up the flat gradients so the frosted
// panes look like a physical material rather than a CSS filter.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function AmbientBackground() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-50 overflow-hidden opacity-[0.55] dark:opacity-[0.38]"
      >
        <div className="absolute top-[-10%] left-[-5%] size-[45vw] rounded-full bg-blue-500 blur-3xl [animation:ambient-drift-1_22s_ease-in-out_infinite]" />
        <div className="absolute top-[20%] right-[-10%] size-[40vw] rounded-full bg-violet-500 blur-3xl [animation:ambient-drift-2_26s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-15%] left-[20%] size-[38vw] rounded-full bg-pink-400 blur-3xl [animation:ambient-drift-3_30s_ease-in-out_infinite]" />
        <div className="absolute top-[55%] left-[55%] size-[30vw] rounded-full bg-cyan-400 blur-3xl [animation:ambient-drift-4_34s_ease-in-out_infinite]" />
      </div>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[60] opacity-[0.035] mix-blend-multiply dark:opacity-[0.06] dark:mix-blend-screen"
        style={{ backgroundImage: GRAIN, backgroundSize: "160px 160px" }}
      />
    </>
  );
}
