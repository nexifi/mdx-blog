import React from "react";
import { safeJsonLd } from "../utils/security";
import type { ArticleFAQ, ArticleHowToStep } from "../types";

/**
 * Common props for all site-wide schemas.
 */
export interface SiteSchemaBaseConfig {
  siteUrl: string;
  siteName: string;
  /** Default language tag (e.g., "fr-FR") */
  locale?: string;
}

export interface OrganizationSchemaConfig extends SiteSchemaBaseConfig {
  /** Absolute or relative URL to the brand logo (PNG/SVG, ≥ 112×112 recommended) */
  logoUrl?: string;
  /** Width of the logo in px (helps Google Rich Results) */
  logoWidth?: number;
  /** Height of the logo in px */
  logoHeight?: number;
  /** Short description / tagline */
  description?: string;
  /** Founding date (ISO 8601) */
  foundingDate?: string;
  /** Public profiles (LinkedIn, X, GitHub, Crunchbase, Wikipedia, ...) — `sameAs` */
  sameAs?: string[];
  /** Contact info — emits a `ContactPoint` */
  contact?: {
    email?: string;
    telephone?: string;
    contactType?: string;
    areaServed?: string | string[];
    availableLanguage?: string | string[];
  };
  /** Postal address — emits a `PostalAddress` */
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  /** Organization type (default: "Organization") */
  organizationType?: "Organization" | "LocalBusiness" | "Corporation" | "NGO";
}

/**
 * Emits a JSON-LD `Organization` schema. Mount this once at the root layout so AI
 * engines (Perplexity, ChatGPT, Google AI Overviews) have a canonical brand definition.
 */
export function OrganizationSchema({ config }: { config: OrganizationSchemaConfig }) {
  const {
    siteUrl,
    siteName,
    locale,
    logoUrl,
    logoWidth = 600,
    logoHeight = 60,
    description,
    foundingDate,
    sameAs,
    contact,
    address,
    organizationType = "Organization",
  } = config;

  const baseUrl = siteUrl.replace(/\/$/, "");
  const resolvedLogo =
    logoUrl && (logoUrl.startsWith("http") ? logoUrl : `${baseUrl}${logoUrl}`);

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": organizationType,
    "@id": `${baseUrl}#organization`,
    name: siteName,
    url: baseUrl,
    ...(description && { description }),
    ...(foundingDate && { foundingDate }),
    ...(locale && { inLanguage: locale }),
    ...(sameAs && sameAs.length > 0 && { sameAs }),
    ...(resolvedLogo && {
      logo: {
        "@type": "ImageObject",
        url: resolvedLogo,
        width: logoWidth,
        height: logoHeight,
      },
      image: resolvedLogo,
    }),
    ...(contact && {
      contactPoint: {
        "@type": "ContactPoint",
        ...(contact.email && { email: contact.email }),
        ...(contact.telephone && { telephone: contact.telephone }),
        contactType: contact.contactType || "customer support",
        ...(contact.areaServed && { areaServed: contact.areaServed }),
        ...(contact.availableLanguage && {
          availableLanguage: contact.availableLanguage,
        }),
      },
    }),
    ...(address && {
      address: {
        "@type": "PostalAddress",
        ...address,
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
    />
  );
}

export interface WebSiteSchemaConfig extends SiteSchemaBaseConfig {
  /** Short description of the website */
  description?: string;
  /** Path to the search results page (e.g., "/search?q={search_term_string}") — emits SearchAction */
  searchUrlTemplate?: string;
  /** Publisher name (defaults to siteName) */
  publisher?: string;
}

/**
 * Emits a JSON-LD `WebSite` schema, including an optional `SearchAction`. Mount once
 * in the root layout. The `@id` matches the one referenced from BlogPosting/WebPage schemas.
 */
export function WebSiteSchema({ config }: { config: WebSiteSchemaConfig }) {
  const { siteUrl, siteName, locale, description, searchUrlTemplate, publisher } = config;
  const baseUrl = siteUrl.replace(/\/$/, "");

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}#website`,
    url: baseUrl,
    name: siteName,
    ...(description && { description }),
    ...(locale && { inLanguage: locale }),
    publisher: { "@id": `${baseUrl}#organization`, name: publisher || siteName },
    ...(searchUrlTemplate && {
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: searchUrlTemplate.startsWith("http")
            ? searchUrlTemplate
            : `${baseUrl}${searchUrlTemplate}`,
        },
        "query-input": "required name=search_term_string",
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
    />
  );
}

export interface PersonSchemaConfig {
  /** Canonical URL of this author/page (defaults to derived) */
  url?: string;
  /** Full name */
  name: string;
  /** Job title or role */
  jobTitle?: string;
  /** Short bio */
  description?: string;
  /** Avatar URL */
  image?: string;
  /** Linked organization (URL or @id) */
  worksFor?: string;
  /** External profiles — `sameAs` (LinkedIn, X, GitHub, Mastodon, ORCID, ...) */
  sameAs?: string[];
  /** Optional expertise areas */
  knowsAbout?: string[];
  /** Site URL (for resolving relative image) */
  siteUrl?: string;
}

/**
 * Emits a JSON-LD `Person` schema. Use on author pages to lift E-E-A-T signals.
 */
export function PersonSchema({ config }: { config: PersonSchemaConfig }) {
  const {
    url,
    name,
    jobTitle,
    description,
    image,
    worksFor,
    sameAs,
    knowsAbout,
    siteUrl,
  } = config;

  const baseUrl = siteUrl?.replace(/\/$/, "");
  const resolvedImage =
    image && baseUrl && !image.startsWith("http") ? `${baseUrl}${image}` : image;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    ...(url && { "@id": `${url}#person`, url }),
    name,
    ...(jobTitle && { jobTitle }),
    ...(description && { description }),
    ...(resolvedImage && { image: resolvedImage }),
    ...(worksFor && {
      worksFor: worksFor.startsWith("http")
        ? { "@type": "Organization", "@id": worksFor }
        : { "@type": "Organization", name: worksFor },
    }),
    ...(sameAs && sameAs.length > 0 && { sameAs }),
    ...(knowsAbout && knowsAbout.length > 0 && { knowsAbout }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
    />
  );
}

export interface FAQSchemaProps {
  faqs: ArticleFAQ[];
  /** Optional URL to attach to the FAQPage `@id` */
  url?: string;
}

/**
 * Emits a JSON-LD `FAQPage`. Renders `null` if `faqs` is empty.
 */
export function FAQSchema({ faqs, url }: FAQSchemaProps) {
  if (!faqs || faqs.length === 0) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    ...(url && { "@id": `${url}#faq` }),
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
    />
  );
}

export interface HowToSchemaProps {
  name: string;
  steps: ArticleHowToStep[];
  description?: string;
  totalTime?: string; // ISO-8601 duration (e.g. "PT15M")
  url?: string;
}

/**
 * Emits a JSON-LD `HowTo`. Renders `null` if fewer than 2 steps are provided.
 */
export function HowToSchema({
  name,
  steps,
  description,
  totalTime,
  url,
}: HowToSchemaProps) {
  if (!steps || steps.length < 2) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    ...(url && { "@id": `${url}#howto` }),
    name,
    ...(description && { description }),
    ...(totalTime && { totalTime }),
    step: steps.map((step, idx) => ({
      "@type": "HowToStep",
      position: idx + 1,
      name: step.name,
      text: step.text,
      ...(step.url && { url: step.url }),
      ...(step.image && { image: step.image }),
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
    />
  );
}

export interface AboutPageSchemaConfig {
  siteUrl: string;
  siteName: string;
  /** Path to the About page (default: "/about") */
  path?: string;
  description?: string;
  locale?: string;
}

/**
 * Emits a JSON-LD `AboutPage` referencing the Organization.
 */
export function AboutPageSchema({ config }: { config: AboutPageSchemaConfig }) {
  const { siteUrl, siteName, path = "/about", description, locale } = config;
  const baseUrl = siteUrl.replace(/\/$/, "");
  const url = `${baseUrl}${path}`;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${url}#aboutpage`,
    url,
    name: `À propos — ${siteName}`,
    ...(description && { description }),
    ...(locale && { inLanguage: locale }),
    isPartOf: { "@id": `${baseUrl}#website` },
    about: { "@id": `${baseUrl}#organization` },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
    />
  );
}
