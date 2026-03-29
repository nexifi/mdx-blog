import React, { createContext, useContext, useRef, ReactNode } from "react";
import { BlogApiConfig } from "./types";
import { BlogApiClient } from "./client";
import { Labels, defaultLabels, mergeLabels } from "./i18n/defaults";

interface BlogProviderProps {
  config: BlogApiConfig;
  labels?: Partial<Labels>;
  children: ReactNode;
}

const BlogContext = createContext<BlogApiClient | null>(null);
const LabelsContext = createContext<Labels>(defaultLabels);

/**
 * Provider pour configurer le client API et les labels globalement
 *
 * @example
 * ```tsx
 * import { BlogProvider } from '@nexifi/mdx-blog';
 *
 * function App({ Component, pageProps }) {
 *   return (
 *     <BlogProvider
 *       config={{ endpoints: { articles: '/articles' } }}
 *       labels={{ backToBlog: "Back to blog", readMore: "Read more" }}
 *     >
 *       <Component {...pageProps} />
 *     </BlogProvider>
 *   );
 * }
 * ```
 */
export function BlogProvider({ config, labels, children }: BlogProviderProps) {
  // Stabilize client reference: only recreate when config values actually change
  const configRef = useRef<string>("");
  const clientRef = useRef<BlogApiClient | null>(null);
  const serialized = JSON.stringify(config);

  if (serialized !== configRef.current) {
    configRef.current = serialized;
    clientRef.current = new BlogApiClient(config);
  }

  const mergedLabels = React.useMemo(() => mergeLabels(labels), [labels]);

  return (
    <BlogContext.Provider value={clientRef.current}>
      <LabelsContext.Provider value={mergedLabels}>
        {children}
      </LabelsContext.Provider>
    </BlogContext.Provider>
  );
}

/**
 * Hook pour accéder au client API
 */
export function useBlogClient(): BlogApiClient {
  const client = useContext(BlogContext);

  if (!client) {
    throw new Error("useBlogClient must be used within a BlogProvider");
  }

  return client;
}

/**
 * Hook pour accéder aux labels (i18n)
 */
export function useLabels(): Labels {
  return useContext(LabelsContext);
}
