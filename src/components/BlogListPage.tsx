import React from "react";
import Link from "next/link";
import { IconCalendar, IconArrowRight } from "./Icons";
import { BlogImage } from "./BlogImage";
import { usePagination, useCategories } from "../hooks";
import { useLabels } from "../provider";
import ArticlePlaceholder, { getIconForCategory } from "./ArticlePlaceholder";

interface BlogListPageProps {
  title?: string;
  subtitle?: string;
  blogPath?: string;
  perPage?: number;
  showCategories?: boolean;
  emptyMessage?: string;
  loadingMessage?: string;
  /** Custom error renderer. Receives the error object. */
  renderError?: (error: Error) => React.ReactNode;
  /** Custom image component (e.g., next/image). Passed to BlogImage `as` prop. */
  ImageComponent?: React.ComponentType<any>;
  /** Site URL for resolving relative image paths */
  siteUrl?: string;
}

export function BlogListPage({
  title = "Blog",
  subtitle,
  blogPath = "/blog",
  perPage = 9,
  showCategories = true,
  emptyMessage,
  loadingMessage,
  renderError,
  ImageComponent,
  siteUrl,
}: BlogListPageProps) {
  const labels = useLabels();
  const resolvedSubtitle = subtitle ?? labels.blogSubtitle;
  const resolvedEmpty = emptyMessage ?? labels.emptyCategory;
  const resolvedLoading = loadingMessage ?? labels.loading;
  const { categories } = useCategories();
  const {
    items: articles,
    pagination,
    setPage,
    setCategory,
    category,
    isLoading,
    error,
  } = usePagination({ perPage });

  // Error state
  if (error) {
    if (renderError) {
      return <>{renderError(error)}</>;
    }
    return (
      <section className="py-12 bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 max-w-7xl text-center py-20">
          <div className="text-red-500 text-6xl mb-4" aria-hidden="true">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600">
            Impossible de charger les articles. Veuillez réessayer plus tard.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* En-tête */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            {title}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{resolvedSubtitle}</p>
        </div>

        {/* Filtres de catégories */}
        {showCategories && categories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-10" role="tablist" aria-label="Filtrer par catégorie">
            {categories.map((cat: string) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                role="tab"
                aria-selected={category === cat}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  category === cat
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-gray-700 hover:bg-blue-50 border border-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* État de chargement */}
        {isLoading && (
          <div className="text-center py-20" aria-live="polite" aria-busy="true">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4" role="status">
              <span className="sr-only">{resolvedLoading}</span>
            </div>
            <p className="text-xl text-gray-500">{resolvedLoading}</p>
          </div>
        )}

        {/* Liste vide */}
        {!isLoading && articles.length === 0 && (
          <div className="text-center py-20">
            <p className="text-xl text-gray-500">{resolvedEmpty}</p>
          </div>
        )}

        {/* Grille d'articles */}
        {!isLoading && articles.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {articles.map((article) => (
                <article
                  key={article.slug}
                  className="bg-white rounded-lg overflow-hidden shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                >
                  <Link href={`${blogPath}/${article.slug}`}>
                    <div className="relative h-48">
                      {article.image ? (
                        <BlogImage
                          src={article.image}
                          alt={article.title}
                          className="w-full h-full object-cover"
                          width={article.imageWidth || 400}
                          height={article.imageHeight || 225}
                          blurDataURL={article.imageBlurDataURL}
                          placeholder={article.imageBlurDataURL ? "blur" : "empty"}
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
                      <div className="absolute top-4 right-4 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        {article.category}
                      </div>
                    </div>
                  </Link>

                  <div className="p-6">
                    {/* Métadonnées */}
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <IconCalendar className="mr-2" />
                      <span>{article.date}</span>
                      {article.readTime && (
                        <>
                          <span className="mx-2">•</span>
                          <span>{article.readTime} min</span>
                        </>
                      )}
                    </div>

                    {/* Titre */}
                    <Link href={`${blogPath}/${article.slug}`}>
                      <h2 className="text-xl font-bold mb-3 hover:text-blue-600 transition-colors text-gray-900 line-clamp-2">
                        {article.title}
                      </h2>
                    </Link>

                    {/* Extrait */}
                    {article.excerpt && (
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {article.excerpt}
                      </p>
                    )}

                    {/* Lien */}
                    <Link
                      href={`${blogPath}/${article.slug}`}
                      className="inline-flex items-center text-blue-600 font-medium hover:underline"
                    >
                      {labels.readMore}
                      <IconArrowRight className="ml-2" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <>
                <nav className="flex justify-center items-center gap-4" aria-label="Pagination">
                  <button
                    onClick={() => setPage(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevious}
                    aria-label={labels.previous}
                    className="px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {labels.previous}
                  </button>

                  <div className="flex items-center gap-2">
                    {Array.from(
                      { length: pagination.totalPages },
                      (_, i) => i + 1
                    )
                      .filter((page) => {
                        // Afficher les 3 premières, les 3 dernières et celles autour de la page actuelle
                        return (
                          page <= 3 ||
                          page > pagination.totalPages - 3 ||
                          Math.abs(page - pagination.currentPage) <= 1
                        );
                      })
                      .map((page, index, array) => {
                        // Ajouter des ellipses si nécessaire
                        const prevPage = array[index - 1];
                        const showEllipsis = prevPage && page - prevPage > 1;

                        return (
                          <React.Fragment key={page}>
                            {showEllipsis && (
                              <span className="text-gray-400">...</span>
                            )}
                            <button
                              onClick={() => setPage(page)}
                              className={`w-10 h-10 rounded-lg font-medium transition-all ${
                                page === pagination.currentPage
                                  ? "bg-blue-600 text-white"
                                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                              }`}
                              aria-label={`Page ${page}`}
                              aria-current={page === pagination.currentPage ? "page" : undefined}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        );
                      })}
                  </div>

                  <button
                    onClick={() => setPage(pagination.currentPage + 1)}
                    disabled={!pagination.hasNext}
                    aria-label={labels.next}
                    className="px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {labels.next}
                  </button>
                </nav>

                <p className="text-center text-gray-600 mt-4">
                  {labels.pageXofY(pagination.currentPage, pagination.totalPages)}{" "}
                  • {labels.articleCount(pagination.totalItems)}
                </p>
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default BlogListPage;
