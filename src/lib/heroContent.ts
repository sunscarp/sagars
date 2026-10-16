export const DEFAULT_HERO_TAGLINE = "Tradition Meets Modern Elegance";

export async function getHeroTagline(): Promise<string> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!projectId || !apiKey) return DEFAULT_HERO_TAGLINE;

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/settings/heroContent?key=${apiKey}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return DEFAULT_HERO_TAGLINE;
    const data = await res.json();
    const value = data?.fields?.tagline?.stringValue;
    return typeof value === "string" && value.trim() ? value : DEFAULT_HERO_TAGLINE;
  } catch {
    return DEFAULT_HERO_TAGLINE;
  }
}
