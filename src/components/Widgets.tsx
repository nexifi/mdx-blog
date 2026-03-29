import React, { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import {
  IconEmail,
  IconCheck,
  IconSpinner,
  IconUser,
  IconCalendar,
  IconTag,
  IconCart,
  IconStar,
  IconExternalLink,
  IconChevronDown,
  IconChevronRight,
  IconList,
} from "./Icons";
import { useLabels } from "../provider";
import { Article } from "../types";

/* ============================================
   WIDGET: Newsletter Signup
   ============================================ */

interface NewsletterProps {
  title?: string;
  description?: string;
  placeholder?: string;
  buttonText?: string;
  successMessage?: string;
  onSubmit?: (email: string) => Promise<void>;
  variant?: "inline" | "card" | "minimal";
  apiEndpoint?: string;
}

/**
 * Formulaire d'inscription newsletter intégrable dans les articles MDX
 *
 * @example
 * ```mdx
 * <Newsletter
 *   title="Restez informé"
 *   description="Recevez nos derniers articles"
 *   apiEndpoint="/api/newsletter"
 * />
 * ```
 */
export const Newsletter: React.FC<NewsletterProps> = (props) => {
  const labels = useLabels();
  const {
    title = labels.newsletterTitle,
    description = labels.newsletterDescription,
    placeholder = labels.newsletterPlaceholder,
    buttonText = labels.newsletterButton,
    successMessage = labels.newsletterSuccess,
    onSubmit,
    variant = "card",
    apiEndpoint,
  } = props;
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    setError("");

    try {
      if (onSubmit) {
        await onSubmit(email);
      } else if (apiEndpoint) {
        const res = await fetch(apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (!res.ok) throw new Error(labels.subscriptionError);
      }
      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : labels.genericError);
    }
  };

  const variants = {
    card: "bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8 rounded-xl shadow-lg my-8",
    inline: "bg-gray-100 p-6 rounded-lg my-6",
    minimal: "border-t border-b border-gray-200 py-6 my-6",
  };

  return (
    <div className={variants[variant]}>
      <div className="flex items-start gap-4">
        <div className="hidden sm:block">
          <IconEmail
            className={`text-3xl ${variant === "card" ? "text-white/80" : "text-blue-600"}`}
          />
        </div>
        <div className="flex-1">
          <h3
            className={`text-xl font-bold mb-2 ${variant === "card" ? "" : "text-gray-900"}`}
          >
            {title}
          </h3>
          <p
            className={`mb-4 ${variant === "card" ? "text-white/90" : "text-gray-600"}`}
          >
            {description}
          </p>

          {status === "success" ? (
            <div
              className={`flex items-center gap-2 ${variant === "card" ? "text-white" : "text-green-600"}`}
            >
              <IconCheck />
              <span>{successMessage}</span>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={placeholder}
                className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
                required
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className={`px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                  variant === "card"
                    ? "bg-white text-blue-600 hover:bg-gray-100"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {status === "loading" ? (
                  <IconSpinner className="animate-spin mx-auto" />
                ) : (
                  buttonText
                )}
              </button>
            </form>
          )}

          {status === "error" && (
            <p className="text-red-400 mt-2 text-sm">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
};

/* ============================================
   WIDGET: Table of Contents
   ============================================ */

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  title?: string;
  maxDepth?: number;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

/**
 * Sommaire automatique basé sur les titres de l'article
 *
 * @example
 * ```mdx
 * <TableOfContents title="Dans cet article" maxDepth={3} />
 * ```
 */
export const TableOfContents: React.FC<TableOfContentsProps> = (props) => {
  const labels = useLabels();
  const {
    title = labels.tableOfContents,
    maxDepth = 3,
    collapsible = true,
    defaultExpanded = true,
  } = props;
  const [items, setItems] = useState<TOCItem[]>([]);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    // Extraire les titres de la page
    const headings = document.querySelectorAll("h2, h3, h4, h5, h6");
    const tocItems: TOCItem[] = [];

    headings.forEach((heading) => {
      const level = parseInt(heading.tagName.charAt(1));
      if (level <= maxDepth + 1) {
        const id =
          heading.id ||
          heading.textContent?.toLowerCase().replace(/\s+/g, "-") ||
          "";
        if (!heading.id) heading.id = id;

        tocItems.push({
          id,
          text: heading.textContent || "",
          level,
        });
      }
    });

    setItems(tocItems);

    // Observer pour highlight actif
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -80% 0px" }
    );

    headings.forEach((heading) => observer.observe(heading));

    return () => observer.disconnect();
  }, [maxDepth]);

  if (items.length === 0) return null;

  return (
    <nav className="bg-gray-50 rounded-lg p-5 my-8 border border-gray-200">
      <button
        onClick={() => collapsible && setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="flex items-center gap-2 font-bold text-gray-900">
          <IconList className="text-blue-600" />
          {title}
        </span>
        {collapsible && (
          <span className="text-gray-500">
            {expanded ? <IconChevronDown /> : <IconChevronRight />}
          </span>
        )}
      </button>

      {expanded && (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              style={{ paddingLeft: `${(item.level - 2) * 16}px` }}
            >
              <a
                href={`#${item.id}`}
                className={`block py-1 text-sm transition-colors hover:text-blue-600 ${
                  activeId === item.id
                    ? "text-blue-600 font-medium"
                    : "text-gray-600"
                }`}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
};

/* ============================================
   WIDGET: Author Bio
   ============================================ */

interface AuthorBioProps {
  name: string;
  title?: string;
  image?: string;
  bio?: string;
  links?: {
    website?: string;
    twitter?: string;
    linkedin?: string;
  };
  variant?: "compact" | "full";
}

/**
 * Carte de présentation de l'auteur
 *
 * @example
 * ```mdx
 * <AuthorBio
 *   name="Jean Dupont"
 *   title="Expert SEO"
 *   bio="Spécialiste en référencement naturel..."
 *   image="/images/jean.jpg"
 * />
 * ```
 */
export const AuthorBio: React.FC<AuthorBioProps> = ({
  name,
  title,
  image,
  bio,
  links,
  variant = "full",
}) => {
  if (variant === "compact") {
    return (
      <div className="flex items-center gap-3 py-4 border-t border-b border-gray-200 my-6">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
          {image ? (
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-blue-100">
              <IconUser className="text-blue-600" />
            </div>
          )}
        </div>
        <div>
          <p className="font-bold text-gray-900">{name}</p>
          {title && <p className="text-sm text-gray-600">{title}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-xl p-6 my-8 border border-gray-200">
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="flex-shrink-0">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
            {image ? (
              <img
                src={image}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-100">
                <IconUser className="text-3xl text-blue-600" />
              </div>
            )}
          </div>
        </div>
        <div className="flex-1">
          <h4 className="text-xl font-bold text-gray-900 mb-1">{name}</h4>
          {title && <p className="text-blue-600 font-medium mb-3">{title}</p>}
          {bio && <p className="text-gray-600 mb-4">{bio}</p>}
          {links && (
            <div className="flex gap-4">
              {links.website && (
                <a
                  href={links.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <IconExternalLink />
                </a>
              )}
              {links.twitter && (
                <a
                  href={`https://twitter.com/${links.twitter.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-blue-400 transition-colors"
                >
                  𝕏
                </a>
              )}
              {links.linkedin && (
                <a
                  href={links.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-blue-700 transition-colors"
                >
                  in
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ============================================
   WIDGET: Product Card (e-commerce)
   ============================================ */

interface ProductCardProps {
  name: string;
  description?: string;
  image?: string;
  price?: string;
  originalPrice?: string;
  rating?: number;
  reviewCount?: number;
  link: string;
  buttonText?: string;
  badge?: string;
  features?: string[];
}

/**
 * Carte produit pour intégration e-commerce dans les articles
 *
 * @example
 * ```mdx
 * <ProductCard
 *   name="Product Pro"
 *   price="49,99 €"
 *   originalPrice="69,99 €"
 *   rating={4.5}
 *   reviewCount={127}
 *   link="/products/pro"
 *   badge="Best-seller"
 * />
 * ```
 */
export const ProductCard: React.FC<ProductCardProps> = (props) => {
  const labels = useLabels();
  const {
    name,
    description,
    image,
    price,
    originalPrice,
    rating,
    reviewCount,
    link,
    buttonText = labels.seeProduct,
    badge,
    features,
  } = props;
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md my-8 hover:shadow-lg transition-shadow">
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="md:w-1/3 relative">
          {image ? (
            <img
              src={image}
              alt={name}
              className="w-full h-48 md:h-full object-cover"
            />
          ) : (
            <div className="w-full h-48 md:h-full bg-gray-100 flex items-center justify-center">
              <IconCart className="text-4xl text-gray-400" />
            </div>
          )}
          {badge && (
            <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              {badge}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="md:w-2/3 p-6">
          <h4 className="text-xl font-bold text-gray-900 mb-2">{name}</h4>

          {/* Rating */}
          {rating !== undefined && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <IconStar
                    key={star}
                    className={
                      star <= Math.floor(rating) ? "" : "text-gray-300"
                    }
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {rating.toFixed(1)}
                {reviewCount && ` (${reviewCount} ${labels.reviews})`}
              </span>
            </div>
          )}

          {description && <p className="text-gray-600 mb-4">{description}</p>}

          {/* Features */}
          {features && features.length > 0 && (
            <ul className="mb-4 space-y-1">
              {features.map((feature, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 text-sm text-gray-600"
                >
                  <IconCheck className="text-green-500 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          )}

          {/* Price & CTA */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-baseline gap-2">
              {price && (
                <span className="text-2xl font-bold text-blue-600">
                  {price}
                </span>
              )}
              {originalPrice && (
                <span className="text-lg text-gray-400 line-through">
                  {originalPrice}
                </span>
              )}
            </div>
            <Link
              href={link}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <IconCart />
              {buttonText}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================
   WIDGET: Related Posts (inline)
   ============================================ */

interface RelatedPostsProps {
  posts: Article[];
  title?: string;
  maxPosts?: number;
  blogPath?: string;
}

/**
 * Bloc d'articles connexes à intégrer dans le contenu
 *
 * @example
 * ```tsx
 * <RelatedPosts posts={relatedArticles} title="À lire aussi" maxPosts={3} />
 * ```
 */
export const RelatedPosts: React.FC<RelatedPostsProps> = (props) => {
  const labels = useLabels();
  const {
    posts,
    title = labels.alsoRead,
    maxPosts = 3,
    blogPath = "/blog",
  } = props;
  const displayPosts = posts.slice(0, maxPosts);

  if (displayPosts.length === 0) return null;

  return (
    <div className="bg-gray-50 rounded-xl p-6 my-8">
      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <IconTag className="text-blue-600" />
        {title}
      </h4>
      <div className="space-y-4">
        {displayPosts.map((post) => (
          <Link
            key={post.slug}
            href={`${blogPath}/${post.slug}`}
            className="flex gap-4 group"
          >
            {post.image && (
              <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h5 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                {post.title}
              </h5>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                <IconCalendar className="flex-shrink-0" />
                <span>{post.date}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

/* ============================================
   WIDGET: Stats/Metrics Box
   ============================================ */

interface StatItem {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface StatsBoxProps {
  stats: StatItem[];
  title?: string;
  variant?: "horizontal" | "vertical" | "grid";
}

/**
 * Boîte de statistiques/métriques
 *
 * @example
 * ```mdx
 * <StatsBox
 *   title="En chiffres"
 *   stats={[
 *     { value: "98%", label: "Satisfaction client" },
 *     { value: "500+", label: "Interventions/an" },
 *     { value: "24h", label: "Délai moyen" }
 *   ]}
 * />
 * ```
 */
export const StatsBox: React.FC<StatsBoxProps> = ({
  stats,
  title,
  variant = "horizontal",
}) => {
  const layouts = {
    horizontal: "flex flex-wrap justify-around gap-6",
    vertical: "space-y-6",
    grid: "grid grid-cols-2 md:grid-cols-4 gap-4",
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-8 my-8">
      {title && <h4 className="text-xl font-bold text-center mb-6">{title}</h4>}
      <div className={layouts[variant]}>
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            {stat.icon && (
              <div className="text-3xl mb-2 opacity-80">{stat.icon}</div>
            )}
            <div className="text-4xl font-bold mb-1">{stat.value}</div>
            <div className="text-white/80">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ============================================
   WIDGET: Feature List
   ============================================ */

interface FeatureListProps {
  features: Array<{
    title: string;
    description?: string;
    icon?: ReactNode;
  }>;
  title?: string;
  variant?: "list" | "grid" | "compact";
}

/**
 * Liste de fonctionnalités/avantages
 *
 * @example
 * ```mdx
 * <FeatureList
 *   title="Nos avantages"
 *   features={[
 *     { title: "Intervention rapide", description: "Sous 24h" },
 *     { title: "Garantie résultat", description: "100% satisfait" }
 *   ]}
 * />
 * ```
 */
export const FeatureList: React.FC<FeatureListProps> = ({
  features,
  title,
  variant = "list",
}) => {
  if (variant === "compact") {
    return (
      <div className="my-6">
        {title && <h4 className="font-bold text-gray-900 mb-3">{title}</h4>}
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <IconCheck className="text-green-500 mt-1 flex-shrink-0" />
              <span className="text-gray-700">{feature.title}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="my-8">
      {title && (
        <h4 className="text-xl font-bold text-gray-900 mb-6">{title}</h4>
      )}
      <div
        className={
          variant === "grid" ? "grid md:grid-cols-2 gap-6" : "space-y-4"
        }
      >
        {features.map((feature, index) => (
          <div
            key={index}
            className="flex gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              {feature.icon || <IconCheck className="text-blue-600" />}
            </div>
            <div>
              <h5 className="font-bold text-gray-900">{feature.title}</h5>
              {feature.description && (
                <p className="text-gray-600 text-sm mt-1">
                  {feature.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Note: Use named imports for tree-shaking:
// import { Newsletter, TableOfContents } from '@nexifi/mdx-blog';
