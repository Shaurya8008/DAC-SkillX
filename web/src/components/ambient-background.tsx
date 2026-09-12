// Sitewide colorful backdrop — no cursor tracking, just a slow ambient
// drift (pure CSS keyframes), so it's cheap enough to mount once in the
// root layout and sit behind every page, including data-heavy ones. This
// is what makes the `.glass` panels throughout the app actually read as
// glass instead of just a translucent gray box: glass needs something
// colorful behind it to refract.
export function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-50 overflow-hidden opacity-[0.35] dark:opacity-25"
    >
      <div
        className="absolute top-[-10%] left-[-5%] size-[45vw] rounded-full bg-blue-500 blur-3xl [animation:ambient-drift-1_22s_ease-in-out_infinite]"
      />
      <div
        className="absolute top-[20%] right-[-10%] size-[40vw] rounded-full bg-violet-500 blur-3xl [animation:ambient-drift-2_26s_ease-in-out_infinite]"
      />
      <div
        className="absolute bottom-[-15%] left-[20%] size-[38vw] rounded-full bg-pink-400 blur-3xl [animation:ambient-drift-3_30s_ease-in-out_infinite]"
      />
    </div>
  );
}
