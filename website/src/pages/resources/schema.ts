// Structured data (JSON-LD) for the Resources pages, used by src/pages/meta.js.
// Entity @ids as in the SEO blueprint (Part A, entity consistency): the same on every page, so search
// and answer engines resolve "Ctruh", "Verse Engine by Ctruh" and "VersaAI" to the same entities.
import { SITE, ORG, PRODUCT, RESOURCE_PAGES, VIDEO } from "./data.ts";
import { canonical, claimOk } from "./utils.ts";

const ID = {
  org: ORG.id,
  website: `${SITE}/#website`,
  verse: `${SITE}/#verse-engine`,
  versaai: "https://www.ctruh.com/#versaai",
};
const abs = (h) => (h.startsWith("http") ? h : SITE + h);

const organization = () => ({
  "@type": "Organization", "@id": ID.org, name: ORG.name, legalName: ORG.legalName,
  url: ORG.url, logo: ORG.logo, email: ORG.email, sameAs: ORG.sameAs,
});
const website = () => ({ "@type": "WebSite", "@id": ID.website, url: `${SITE}/`, name: PRODUCT.name, publisher: { "@id": ID.org } });
const verseEngine = () => ({
  "@type": "SoftwareApplication", "@id": ID.verse, name: PRODUCT.name, alternateName: PRODUCT.short,
  url: PRODUCT.url, applicationCategory: "DeveloperApplication", operatingSystem: "Any (modern web browser: Windows, macOS, Linux, Android, iOS)",
  description: PRODUCT.definition, publisher: { "@id": ID.org },
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Free plan. Paid plans from $29 per month. Viewers never pay.", url: `${SITE}/pricing` },
});
const versaAI = () => ({
  "@type": "SoftwareApplication", "@id": ID.versaai, name: "VersaAI", applicationCategory: "DesignApplication",
  description: "VersaAI is Ctruh's AI-powered 3D creation layer. It is a separate capability from Verse Engine by Ctruh.",
  publisher: { "@id": ID.org },
});
const breadcrumbs = (items) => ({
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: abs(it.href) })),
});
function faqPage(key) {
  const items = RESOURCE_PAGES[key].faq.filter((f) => claimOk(f.claim));
  if (!items.length) return null;
  return {
    "@type": "FAQPage", "@id": canonical(key) + "#faq",
    mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

/** The JSON-LD graph for a Resources page (key as in RESOURCE_PAGES), from its meta (title, description, social image). */
export function resourcesJsonLd(key: string, { title, description, ogImage }: { title: string; description: string; ogImage?: string }) {
  const ai = key === "aiInfra";
  const page: Record<string, any> = {
    "@type": "WebPage", "@id": canonical(key) + "#webpage", url: canonical(key), name: title, description,
    isPartOf: { "@id": ID.website }, about: (ai ? [ID.verse, ID.versaai] : [ID.verse]).map((id) => ({ "@id": id })),
    ...(ai && { mentions: [{ "@id": ID.org }] }),
    inLanguage: "en", publisher: { "@id": ID.org }, primaryImageOfPage: { "@type": "ImageObject", url: abs(ogImage) },
  };
  const nodes: Record<string, unknown>[] = [page, breadcrumbs(RESOURCE_PAGES[key].crumbs), faqPage(key), verseEngine()];
  if (ai) nodes.push(versaAI());
  if (key === "lyon") {
    page.about.push({ "@type": "Place", name: "Lyon, France" });
    if (claimOk("lyon-video") && (VIDEO.embedUrl || VIDEO.contentUrl)) nodes.push({
      "@type": "VideoObject", name: VIDEO.title, description: VIDEO.description, thumbnailUrl: abs(VIDEO.thumbnailUrl),
      uploadDate: VIDEO.uploadDate, duration: VIDEO.duration, embedUrl: VIDEO.embedUrl || undefined, contentUrl: VIDEO.contentUrl ? abs(VIDEO.contentUrl) : undefined,
      publisher: { "@id": ID.org },
    });
  }
  return { "@context": "https://schema.org", "@graph": [organization(), website(), ...nodes.filter(Boolean)] };
}
