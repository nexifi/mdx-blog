import React, { ReactNode } from "react";
import Link from "next/link";
import {
  IconCalendar,
  IconArrowLeft,
  IconFacebook,
  IconTwitter,
  IconLinkedin,
  IconWhatsapp,
  IconEmail,
} from "./Icons";
import { BlogImage } from "./BlogImage";
import type { BlogImageProps } from "./BlogImage";
import { Article } from "../types";
import { useLabels } from "../provider";
import ArticlePlaceholder, { getIconForCategory } from "./ArticlePlaceholder";

interface ArticleLayoutProps {
  article: Article;
  relatedArticles?: Article[];
  children: ReactNode;
  // Props personnalisables
  siteTitle?: string;
  blogPath?: string;
  homePath?: string;
  showBreadcrumb?: boolean;
  showBackButton?: boolean;
  showShareButtons?: boolean;
  showTags?: boolean;
  showRelatedArticles?: boolean;
  /** Custom image component (e.g., next/image). Passed to BlogImage `as` prop. */
  ImageComponent?: React.ComponentType<any>;
  /** Site URL for resolving relative image paths */
  siteUrl?: string;
}

export function ArticleLayout({
  article,
  relatedArticles = [],
  children,
  siteTitle = "",
  blogPath = "/blog",
  homePath = "/",
  showBreadcrumb = true,
  showBackButton = true,
  showShareButtons = true,
  showTags = true,
  showRelatedArticles = true,
  ImageComponent,
  siteUrl,
}: ArticleLayoutProps) {
  const labels = useLabels();
  // URL pour le partage
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${blogPath}/${article.slug}`
      : "";

  const shareText = encodeURIComponent(article.title);

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Fil d'Ariane */}
        {showBreadcrumb && (
          <div className="flex items-center text-sm mb-6 text-gray-600">
            <Link href={homePath} className="hover:text-blue-600">
              {labels.home}
            </Link>
            <span className="mx-2">/</span>
            <Link href={blogPath} className="hover:text-blue-600">
              {labels.blog}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-blue-600 truncate">{article.title}</span>
          </div>
        )}

        {/* Bouton retour */}
        {showBackButton && (
          <Link
            href={blogPath}
            className="inline-flex items-center text-blue-600 font-medium text-sm mb-6 hover:underline"
          >
            <IconArrowLeft className="mr-2" /> {labels.backToBlog}
          </Link>
        )}

        {/* En-tête de l'article */}
        <div className="bg-white rounded-xl overflow-hidden shadow-lg">
          {/* Image d'en-tête */}
          <div className="relative h-[300px] md:h-[400px]">
            {article.image ? (
              <BlogImage
                src={article.image}
                alt={article.title}
                className="w-full h-full object-cover"
                width={article.imageWidth || 1200}
                height={article.imageHeight || 630}
                blurDataURL={article.imageBlurDataURL}
                placeholder={article.imageBlurDataURL ? "blur" : "empty"}
                priority
                siteUrl={siteUrl}
                as={ImageComponent}
              />
            ) : (
              <ArticlePlaceholder
                category={article.category}
                title={article.title}
                icon={getIconForCategory(article.category)}
              />
            )}
            <div className="absolute top-4 right-4 bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg z-10">
              {article.category}
            </div>
          </div>

          <div className="p-6 md:p-10">
            {/* Métadonnées */}
            <div className="flex items-center text-sm text-gray-500 mb-4">
              <IconCalendar className="mr-2" />
              <span>{article.date}</span>
              {article.readTime && (
                <>
                  <span className="mx-3">•</span>
                  <span>{article.readTime} {labels.minRead}</span>
                </>
              )}
            </div>

            {/* Titre */}
            <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
              {article.title}
            </h1>

            {/* Excerpt/Introduction */}
            {article.excerpt && (
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                {article.excerpt}
              </p>
            )}

            {/* Auteur */}
            {article.author && (
              <div className="flex items-center mb-8 pb-6 border-b">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  {article.authorImage ? (
                    <BlogImage
                      src={article.authorImage}
                      alt={article.author}
                      className="w-full h-full rounded-full object-cover"
                      width={48}
                      height={48}
                      siteUrl={siteUrl}
                      as={ImageComponent}
                    />
                  ) : (
                    <span className="font-bold text-blue-600">
                      {article.author.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{article.author}</p>
                  {article.authorTitle && (
                    <p className="text-sm text-gray-600">
                      {article.authorTitle}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Boutons de partage */}
            {showShareButtons && (
              <div className="flex items-center justify-start gap-2 mb-8">
                <p className="text-sm font-medium text-gray-700">{labels.share}</p>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:opacity-80 transition-opacity"
                  aria-label="Facebook"
                >
                  <IconFacebook />
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-[#1DA1F2] text-white flex items-center justify-center hover:opacity-80 transition-opacity"
                  aria-label="Twitter"
                >
                  <IconTwitter />
                </a>
                <a
                  href={`https://www.linkedin.com/shareArticle?mini=true&url=${shareUrl}&title=${shareText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-[#0A66C2] text-white flex items-center justify-center hover:opacity-80 transition-opacity"
                  aria-label="LinkedIn"
                >
                  <IconLinkedin />
                </a>
                <a
                  href={`https://wa.me/?text=${shareText}%20${shareUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center hover:opacity-80 transition-opacity"
                  aria-label="WhatsApp"
                >
                  <IconWhatsapp />
                </a>
                <a
                  href={`mailto:?subject=${shareText}&body=${shareUrl}`}
                  className="w-8 h-8 rounded-full bg-gray-500 text-white flex items-center justify-center hover:opacity-80 transition-opacity"
                  aria-label="Email"
                >
                  <IconEmail />
                </a>
              </div>
            )}

            {/* Contenu de l'article */}
            <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900">
              {children}
            </div>

            {/* Tags */}
            {showTags && article.tags && article.tags.length > 0 && (
              <div className="border-t border-gray-200 mt-10 pt-6">
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    {labels.tags}
                  </span>
                  {article.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-gray-100 rounded-full text-xs hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section articles similaires */}
        {showRelatedArticles &&
          relatedArticles &&
          relatedArticles.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">
                {labels.relatedArticles}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {relatedArticles.map((post) => (
                  <article
                    key={post.slug}
                    className="bg-white rounded-lg overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg"
                  >
                    <Link href={`${blogPath}/${post.slug}`}>
                      <div className="relative">
                        {post.image ? (
                          <div className="h-48 overflow-hidden">
                            <BlogImage
                              src={post.image}
                              alt={post.title}
                              className="w-full h-full object-cover transition-transform duration-500 transform hover:scale-110"
                              width={post.imageWidth || 400}
                              height={post.imageHeight || 225}
                              blurDataURL={post.imageBlurDataURL}
                              placeholder={post.imageBlurDataURL ? "blur" : "empty"}
                              siteUrl={siteUrl}
                              as={ImageComponent}
                            />
                          </div>
                        ) : (
                          <ArticlePlaceholder
                            category={post.category}
                            title={post.title}
                            icon={getIconForCategory(post.category)}
                          />
                        )}
                        <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 z-20 rounded-bl-lg">
                          {post.category}
                        </div>
                      </div>
                    </Link>

                    <div className="p-5">
                      <div className="flex items-center text-xs text-gray-500 mb-3">
                        <IconCalendar className="mr-1" />
                        <span>{post.date}</span>
                      </div>

                      <Link href={`${blogPath}/${post.slug}`}>
                        <h3 className="text-lg font-bold mb-3 hover:text-blue-600 transition-colors text-gray-900">
                          {post.title}
                        </h3>
                      </Link>

                      {post.excerpt && (
                        <p className="text-gray-600 mb-4 text-sm line-clamp-3">
                          {post.excerpt}
                        </p>
                      )}

                      <Link
                        href={`${blogPath}/${post.slug}`}
                        className="inline-flex items-center text-blue-600 font-medium text-sm hover:underline"
                      >
                        {labels.readArticle}{" "}
                        <IconArrowLeft className="ml-2 transform rotate-180" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
      </div>
    </section>
  );
}

export default ArticleLayout;
