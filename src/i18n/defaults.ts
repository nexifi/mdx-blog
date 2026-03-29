/**
 * Default labels (French) for all UI components.
 * Consumers can override any label via BlogProvider's `labels` prop.
 */

export interface Labels {
  // Navigation
  home: string;
  blog: string;
  backToBlog: string;

  // Article
  readMore: string;
  readArticle: string;
  relatedArticles: string;
  tags: string;
  share: string;
  minRead: string;
  allArticles: string;

  // Blog list
  blogSubtitle: string;
  emptyCategory: string;
  noArticlesFound: string;
  loading: string;
  previous: string;
  next: string;
  pageXofY: (current: number, total: number) => string;
  articleCount: (count: number) => string;

  // Widgets
  newsletterTitle: string;
  newsletterDescription: string;
  newsletterPlaceholder: string;
  newsletterButton: string;
  newsletterSuccess: string;
  tableOfContents: string;
  seeProduct: string;
  alsoRead: string;
  ourAdvantages: string;
  reviews: string;

  // Errors
  subscriptionError: string;
  genericError: string;

  // Schema
  blogPrefix: string;
  discoverArticles: string;
}

/**
 * Default French labels
 */
export const defaultLabels: Labels = {
  // Navigation
  home: "Accueil",
  blog: "Blog",
  backToBlog: "Retour au blog",

  // Article
  readMore: "Lire la suite",
  readArticle: "Lire l'article",
  relatedArticles: "Articles similaires",
  tags: "Tags :",
  share: "Partager :",
  minRead: "min de lecture",
  allArticles: "Tous les articles",

  // Blog list
  blogSubtitle: "Découvrez nos derniers articles",
  emptyCategory: "Aucun article trouvé dans cette catégorie.",
  noArticlesFound: "Aucun article trouvé dans cette catégorie.",
  loading: "Chargement...",
  previous: "Précédent",
  next: "Suivant",
  pageXofY: (current, total) => `Page ${current} sur ${total}`,
  articleCount: (count) => `${count} article${count > 1 ? "s" : ""}`,

  // Widgets
  newsletterTitle: "Inscrivez-vous à notre newsletter",
  newsletterDescription:
    "Recevez nos derniers articles directement dans votre boîte mail",
  newsletterPlaceholder: "Votre adresse email",
  newsletterButton: "S'inscrire",
  newsletterSuccess: "Merci ! Vous êtes inscrit.",
  tableOfContents: "Sommaire",
  seeProduct: "Voir le produit",
  alsoRead: "À lire aussi",
  ourAdvantages: "Nos avantages",
  reviews: "avis",

  // Errors
  subscriptionError: "Erreur lors de l'inscription",
  genericError: "Une erreur est survenue",

  // Schema
  blogPrefix: "Blog",
  discoverArticles: "Découvrez tous nos articles",
};

/**
 * Merges partial label overrides with defaults.
 */
export function mergeLabels(overrides?: Partial<Labels>): Labels {
  if (!overrides) return defaultLabels;
  return { ...defaultLabels, ...overrides };
}
