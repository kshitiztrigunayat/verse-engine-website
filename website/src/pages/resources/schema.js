// Structured data (JSON-LD) for the Resources pages, used by src/pages/meta.js.
// Entity @ids match the home page's, so search and answer engines resolve "Ctruh" and
// "Verse Engine by Ctruh" to the same entities across the site.
import { SITE, ORG, PRODUCT, ROUTES, RESOURCE_PAGES, VIDEO } from "./data.js";
import { canonical, claimOk } from "./utils.js";

const ID = {
  org: ORG.id,
  website: `${SITE}/#website`,
  verse: `${SITE}/#software`,
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
  url: PRODUCT.url, applicationCategory: "DeveloperApplication", operatingSystem: "Web browser (WebGPU or WebGL2)",
  description: PRODUCT.definition, publisher: { "@id": ID.org },
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Free plan", url: `${SITE}/pricing` },
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

/** The JSON-LD graph for a Resources page (key as in RESOURCE_PAGES), from its meta title and description. */
export function resourcesJsonLd(key, { title, description }) {
  const ai = key === "aiInfra";
  const page = {
    "@type": "WebPage", "@id": canonical(key) + "#webpage", url: canonical(key), name: title, description,
    isPartOf: { "@id": ID.website }, about: (ai ? [ID.verse, ID.versaai] : [ID.verse]).map((id) => ({ "@id": id })),
    ...(ai && { mentions: [{ "@id": ID.org }] }),
    inLanguage: "en", publisher: { "@id": ID.org }, primaryImageOfPage: { "@type": "ImageObject", url: abs(ROUTES[key].image) },
  };
  const nodes = [page, breadcrumbs(RESOURCE_PAGES[key].crumbs), faqPage(key), verseEngine()];
  if (ai) nodes.push(versaAI());
  if (key === "lyon") {
    page.about.push({ "@type": "Place", name: "Lyon, France" });
    if (claimOk("lyon-video") && VIDEO.embedUrl) nodes.push({
      "@type": "VideoObject", name: VIDEO.title, description: VIDEO.description, thumbnailUrl: abs(VIDEO.thumbnailUrl),
      uploadDate: VIDEO.uploadDate, duration: VIDEO.duration, embedUrl: VIDEO.embedUrl, contentUrl: VIDEO.contentUrl || undefined,
      publisher: { "@id": ID.org },
    });
  }
  return { "@context": "https://schema.org", "@graph": [organization(), website(), ...nodes.filter(Boolean)] };
}
