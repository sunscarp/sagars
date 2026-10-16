import HomeClient from "./HomeClient";
import { getHeroTagline } from "@/lib/heroContent";

export const dynamic = "force-dynamic";

export default async function Page() {
  const initialHeroTagline = await getHeroTagline();
  return <HomeClient initialHeroTagline={initialHeroTagline} />;
}
