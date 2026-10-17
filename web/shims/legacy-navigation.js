// The legacy (non-static) home navigator is never used by the static flow, so
// the web build swaps it for an empty component instead of bundling the old app.
export default function LegacyNavigation() {
  return null;
}
