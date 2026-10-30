import styles from "./jocyn.module.css";

interface PublicBrand {
  id: string;
  display_name: string;
  stylized_name: string;
  bio: string;
  slug: string;
}

interface PublicLink {
  id: string;
  label: string;
  url: string;
  kind: string;
  position: number;
}

async function loadHub(): Promise<{ brand: PublicBrand | null; links: PublicLink[] }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { brand: null, links: [] };

  const headers = { apikey: key };
  const brandResponse = await fetch(
    url + "/rest/v1/artist_brands?slug=eq.jocyn&is_public=eq.true&select=id,display_name,stylized_name,bio,slug&limit=1",
    { headers, cache: "no-store" }
  ).catch(() => null);

  if (!brandResponse?.ok) return { brand: null, links: [] };
  const brands = await brandResponse.json() as PublicBrand[];
  const brand = brands[0] ?? null;
  if (!brand) return { brand: null, links: [] };

  const linkResponse = await fetch(
    url + "/rest/v1/artist_links?brand_id=eq." + brand.id + "&is_visible=eq.true&select=id,label,url,kind,position&order=position.asc",
    { headers, cache: "no-store" }
  ).catch(() => null);

  const links = linkResponse?.ok ? await linkResponse.json() as PublicLink[] : [];
  return { brand, links };
}

export default async function JocynHubPage(): Promise<React.JSX.Element> {
  const { brand, links } = await loadHub();
  const name = brand?.stylized_name || "JO₵YN";
  const bio = brand?.bio || "Music. Film. Movement.";

  return (
    <main className={styles.shell}>
      <div className={styles.noise} />
      <section className={styles.card}>
        <div className={styles.avatar}>J</div>
        <div className={styles.identity}>
          <span className={styles.kicker}>Artist / New Orleans</span>
          <h1>{name}</h1>
          <p>{bio}</p>
        </div>

        <div className={styles.socialRow} aria-label="JO₵YN social destinations">
          <span>IG</span><span>TT</span><span>YT</span><span>SP</span><span>AM</span>
        </div>

        <div className={styles.links}>
          {links.length === 0 ? (
            <div className={styles.placeholder}>
              <strong>JO₵YN WORLD</strong>
              <span>Official links are being added.</span>
            </div>
          ) : links.map((link, index) => (
            <a href={link.url} key={link.id} target="_blank" rel="noreferrer" className={index === 0 ? styles.primaryLink : styles.link}>
              <span>{link.label}</span>
              <strong>↗</strong>
            </a>
          ))}
        </div>

        <footer>
          <span>JO₵YN</span>
          <span>Official artist hub</span>
        </footer>
      </section>
    </main>
  );
}
