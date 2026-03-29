import React from "react";
import type { ImageLoader, ImageSource } from "../utils/image";
import {
  resolveImageUrl,
  generateSrcSet,
  generateSizes,
  DEFAULT_WIDTHS,
  isExternalImage,
} from "../utils/image";

/**
 * Props for the generic BlogImage component
 */
export interface BlogImageProps {
  /** Image URL (relative or absolute) */
  src: string;
  /** Alt text (required for accessibility) */
  alt: string;
  /** Explicit width */
  width?: number;
  /** Explicit height */
  height?: number;
  /** CSS class */
  className?: string;
  /** Aspect ratio (e.g., 16/9). Used to compute height if not provided. */
  aspectRatio?: number;
  /** Priority image — disables lazy loading + adds fetchpriority="high" */
  priority?: boolean;
  /** Blur placeholder data URL (base64 or data: URI) */
  blurDataURL?: string;
  /** Show blur placeholder while loading (requires blurDataURL) */
  placeholder?: "blur" | "empty";
  /** Responsive sizes attribute or breakpoint map */
  sizes?: string | Record<string, string>;
  /** Custom widths for srcset generation */
  srcSetWidths?: number[];
  /** Custom image loader (e.g., Cloudinary, Imgix, Vercel) */
  loader?: ImageLoader;
  /** Image quality for loader (1-100, default: 75) */
  quality?: number;
  /** Base URL to resolve relative paths */
  siteUrl?: string;
  /** Object fit */
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  /** Object position */
  objectPosition?: string;
  /** Callback on load */
  onLoad?: () => void;
  /** Callback on error */
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  /** HTML style attribute */
  style?: React.CSSProperties;
  /** HTML id attribute */
  id?: string;
  /** Custom image component (e.g., next/image). Overrides native rendering. */
  as?: React.ComponentType<any>;
}

/**
 * Generic responsive image component with lazy loading, blur placeholder,
 * srcset generation, and error fallback.
 *
 * Framework-agnostic: works with plain HTML `<img>` by default,
 * or pass `as={Image}` from next/image for Next.js optimization.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <BlogImage src="/img/hero.webp" alt="Hero" />
 *
 * // With blur placeholder
 * <BlogImage
 *   src="/img/hero.webp"
 *   alt="Hero"
 *   blurDataURL="data:image/jpeg;base64,/9j/4AAQ..."
 *   placeholder="blur"
 *   width={1200}
 *   height={630}
 * />
 *
 * // Responsive with breakpoints
 * <BlogImage
 *   src="/img/hero.webp"
 *   alt="Hero"
 *   sizes={{ sm: "100vw", md: "50vw", lg: "33vw" }}
 * />
 *
 * // With next/image
 * import Image from "next/image";
 * <BlogImage src="/img/hero.webp" alt="Hero" as={Image} width={800} height={450} />
 *
 * // With Cloudinary loader
 * <BlogImage
 *   src="hero.webp"
 *   alt="Hero"
 *   loader={({ src, width, quality }) =>
 *     `https://res.cloudinary.com/demo/image/fetch/w_${width},q_${quality}/${src}`
 *   }
 * />
 * ```
 */
export function BlogImage({
  src,
  alt,
  width,
  height,
  className = "",
  aspectRatio,
  priority = false,
  blurDataURL,
  placeholder = "empty",
  sizes,
  srcSetWidths,
  loader,
  quality = 75,
  siteUrl,
  objectFit = "cover",
  objectPosition = "center",
  onLoad,
  onError: onErrorProp,
  style,
  id,
  as: CustomComponent,
}: BlogImageProps) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  // Resolve URL
  const resolvedSrc = resolveImageUrl(src, siteUrl);

  // Compute height from aspectRatio if needed
  const computedHeight =
    height || (width && aspectRatio ? Math.round(width / aspectRatio) : undefined);

  // Build sizes string
  const sizesAttr =
    typeof sizes === "string"
      ? sizes
      : typeof sizes === "object"
        ? generateSizes(sizes)
        : undefined;

  // Build srcSet if we have a loader or widths
  const srcSetAttr =
    loader || srcSetWidths
      ? generateSrcSet(src, srcSetWidths || [...DEFAULT_WIDTHS], {
          loader,
          quality,
        })
      : undefined;

  // Loading strategy
  const loading = priority ? undefined : ("lazy" as const);
  const fetchPriority = priority ? ("high" as const) : undefined;
  const decoding = priority ? ("sync" as const) : ("async" as const);

  // Blur placeholder styles
  const showBlur = placeholder === "blur" && blurDataURL && !isLoaded;

  const handleLoad = React.useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = React.useCallback(
    (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      setHasError(true);
      onErrorProp?.(e);
    },
    [onErrorProp],
  );

  // If a custom component is provided (e.g., next/image), delegate to it
  if (CustomComponent) {
    const customProps: Record<string, unknown> = {
      src: resolvedSrc,
      alt,
      width,
      height: computedHeight,
      className,
      sizes: sizesAttr,
      quality,
      style: { objectFit, objectPosition, ...style },
      onLoad: handleLoad,
      onError: handleError,
      id,
    };

    // Only pass these when they carry a meaningful value —
    // avoids React DOM warnings when the custom component renders a plain <img>.
    if (priority) customProps.priority = true;
    if (blurDataURL) {
      customProps.placeholder = "blur";
      customProps.blurDataURL = blurDataURL;
    }

    return <CustomComponent {...customProps} />;
  }

  // Error fallback
  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`}
        style={{
          width: width ? `${width}px` : "100%",
          height: computedHeight ? `${computedHeight}px` : "200px",
          ...style,
        }}
        role="img"
        aria-label={alt}
        id={id}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
    );
  }

  // Base img styles
  const imgStyle: React.CSSProperties = {
    objectFit,
    objectPosition,
    ...(showBlur
      ? {
          backgroundImage: `url(${blurDataURL})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
      : {}),
    ...style,
  };

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      width={width}
      height={computedHeight}
      className={`${className}${showBlur ? " transition-opacity duration-300" : ""}`}
      style={imgStyle}
      loading={loading}
      decoding={decoding}
      // @ts-expect-error — fetchpriority is valid HTML but not yet in React types
      fetchpriority={fetchPriority}
      srcSet={srcSetAttr}
      sizes={sizesAttr}
      onLoad={handleLoad}
      onError={handleError}
      id={id}
      {...(isExternalImage(resolvedSrc, siteUrl)
        ? { crossOrigin: "anonymous" as const, referrerPolicy: "no-referrer" as const }
        : {})}
    />
  );
}

export default BlogImage;
