# Internationalization (i18n)

All UI strings in `@nexifi/mdx-blog` are customizable through a labels system. French is the default language.

## Import

```tsx
import { defaultLabels, mergeLabels } from '@nexifi/mdx-blog';
import type { Labels } from '@nexifi/mdx-blog';
```

---

## Labels Interface

```typescript
interface Labels {
  home: string;                    // "Accueil"
  blog: string;                    // "Blog"
  backToBlog: string;              // "Retour au blog"
  readMore: string;                // "Lire la suite"
  readArticle: string;             // "Lire l'article"
  relatedArticles: string;         // "Articles similaires"
  tags: string;                    // "Tags :"
  share: string;                   // "Partager :"
  minRead: string;                 // "min de lecture"
  allArticles: string;             // "Tous les articles"
  blogSubtitle: string;            // "Découvrez nos derniers articles"
  emptyCategory: string;           // "Aucun article trouvé dans cette catégorie."
  noArticlesFound: string;         // "Aucun article trouvé dans cette catégorie."
  loading: string;                 // "Chargement..."
  previous: string;                // "Précédent"
  next: string;                    // "Suivant"
  pageXofY: (current: number, total: number) => string;   // "Page X sur Y"
  articleCount: (count: number) => string;                  // "X article(s)"
  newsletterTitle: string;         // "Inscrivez-vous à notre newsletter"
  newsletterDescription: string;   // "Recevez nos derniers articles..."
  newsletterPlaceholder: string;   // "Votre adresse email"
  newsletterButton: string;        // "S'inscrire"
  newsletterSuccess: string;       // "Merci ! Vous êtes inscrit."
  tableOfContents: string;         // "Sommaire"
  seeProduct: string;              // "Voir le produit"
  alsoRead: string;                // "À lire aussi"
  ourAdvantages: string;           // "Nos avantages"
  reviews: string;                 // "avis"
  subscriptionError: string;       // "Erreur lors de l'inscription"
  genericError: string;            // "Une erreur est survenue"
  blogPrefix: string;              // "Blog"
  discoverArticles: string;        // "Découvrez tous nos articles"
}
```

---

## Overriding Labels

Pass a partial `labels` object to `BlogProvider`. Only the keys you provide will be overridden; all others keep their French defaults.

### English Override Example

```tsx
<BlogProvider
  config={config}
  labels={{
    home: 'Home',
    blog: 'Blog',
    backToBlog: 'Back to blog',
    readMore: 'Read more',
    readArticle: 'Read article',
    relatedArticles: 'Related articles',
    tags: 'Tags:',
    share: 'Share:',
    minRead: 'min read',
    allArticles: 'All articles',
    blogSubtitle: 'Discover our latest articles',
    emptyCategory: 'No articles found in this category.',
    noArticlesFound: 'No articles found.',
    loading: 'Loading...',
    previous: 'Previous',
    next: 'Next',
    pageXofY: (current, total) => `Page ${current} of ${total}`,
    articleCount: (count) => `${count} article${count > 1 ? 's' : ''}`,
    newsletterTitle: 'Subscribe to our newsletter',
    newsletterDescription: 'Get our latest articles in your inbox',
    newsletterPlaceholder: 'Your email address',
    newsletterButton: 'Subscribe',
    newsletterSuccess: 'Thank you! You are subscribed.',
    tableOfContents: 'Table of Contents',
    seeProduct: 'View product',
    alsoRead: 'Also read',
    ourAdvantages: 'Our advantages',
    reviews: 'reviews',
    subscriptionError: 'Subscription error',
    genericError: 'An error occurred',
    blogPrefix: 'Blog',
    discoverArticles: 'Discover all our articles',
  }}
>
  {children}
</BlogProvider>
```

### Partial Override

You don't need to override everything:

```tsx
<BlogProvider
  config={config}
  labels={{
    readMore: 'Read more',
    backToBlog: 'Back to blog',
  }}
>
```

---

## Using with i18n Frameworks

### Next.js + next-intl / next-i18next

```tsx
// src/app/[locale]/providers.tsx
'use client';
import { BlogProvider } from '@nexifi/mdx-blog';
import { useTranslations } from 'next-intl';

export function Providers({ children }: { children: React.ReactNode }) {
  const t = useTranslations('blog');

  return (
    <BlogProvider
      config={config}
      labels={{
        readMore: t('readMore'),
        backToBlog: t('backToBlog'),
        loading: t('loading'),
        // ... map your i18n keys
      }}
    >
      {children}
    </BlogProvider>
  );
}
```

### With a dictionary object

```tsx
const dictionaries = {
  en: {
    readMore: 'Read more',
    backToBlog: 'Back to blog',
    // ...
  },
  fr: {
    readMore: 'Lire la suite',
    backToBlog: 'Retour au blog',
    // ...
  },
};

function Providers({ locale, children }) {
  return (
    <BlogProvider config={config} labels={dictionaries[locale]}>
      {children}
    </BlogProvider>
  );
}
```

---

## mergeLabels()

Utility function to merge partial overrides with defaults:

```typescript
import { defaultLabels, mergeLabels } from '@nexifi/mdx-blog';

const labels = mergeLabels({
  readMore: 'Read more',
  backToBlog: 'Back to blog',
});
// → Full Labels object with overridden values
```

---

## useLabels() Hook

Access the current labels in any component:

```tsx
import { useLabels } from '@nexifi/mdx-blog';

function MyComponent() {
  const labels = useLabels();
  return <p>{labels.loading}</p>;
}
```

This hook returns the default labels even outside `BlogProvider`, so it's safe to use anywhere.
