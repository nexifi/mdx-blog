# BlogImage

Responsive image component with lazy loading, blur placeholders, srcset generation, and error fallback.

## Import

```tsx
import { BlogImage } from '@nexifi/mdx-blog';
import type { BlogImageProps } from '@nexifi/mdx-blog';
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | **required** | Image source URL |
| `alt` | `string` | **required** | Alt text |
| `width` | `number` | — | Image width in pixels |
| `height` | `number` | — | Image height in pixels |
| `className` | `string` | — | CSS class names |
| `priority` | `boolean` | `false` | Disable lazy loading (above-the-fold images) |
| `placeholder` | `"blur" \| "empty"` | `"empty"` | Placeholder strategy |
| `blurDataURL` | `string` | — | Base64 blur data URL |
| `siteUrl` | `string` | — | Site URL for resolving relative paths |
| `as` | `React.ComponentType` | `<img>` | Custom image component (e.g., `next/image`) |
| `sizes` | `string` | Auto-generated | Custom `sizes` attribute |

## Basic Usage

```tsx
<BlogImage
  src="/images/hero.jpg"
  alt="Hero image"
  width={1200}
  height={630}
/>
```

## With Blur Placeholder

```tsx
<BlogImage
  src="/images/hero.jpg"
  alt="Hero image"
  width={1200}
  height={630}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQ..."
/>
```

## With Custom Image Component

Delegate rendering to a framework-specific image component (e.g., `next/image`):

```tsx
import Image from 'next/image';

<BlogImage
  src="/images/hero.jpg"
  alt="Hero image"
  width={1200}
  height={630}
  as={Image}
/>
```

## Priority Loading

For above-the-fold images, disable lazy loading:

```tsx
<BlogImage
  src="/images/hero.jpg"
  alt="Hero image"
  width={1200}
  height={630}
  priority
/>
```

## Error Handling

If the image fails to load, `BlogImage` automatically falls back to a placeholder showing the alt text.

## Image Utilities

The package also exports pure utility functions for image handling:

```typescript
import {
  resolveImageUrl,
  generateSrcSet,
  generateSizes,
  computeHeight,
  buildImageObject,
  isExternalImage,
  getExternalOrigin,
  DEFAULT_WIDTHS,
  ASPECT_RATIOS,
} from '@nexifi/mdx-blog';
```

### resolveImageUrl(src, siteUrl?)

Resolves a relative image path to an absolute URL.

```typescript
resolveImageUrl('/images/hero.jpg', 'https://example.com');
// → 'https://example.com/images/hero.jpg'

resolveImageUrl('https://cdn.example.com/hero.jpg');
// → 'https://cdn.example.com/hero.jpg' (unchanged)
```

### generateSrcSet(src, widths?)

Generates a `srcset` attribute value for responsive images.

```typescript
generateSrcSet('/images/hero.jpg');
// → '/images/hero.jpg 320w, /images/hero.jpg 640w, /images/hero.jpg 960w, ...'
```

### generateSizes(maxWidth?)

Generates a `sizes` attribute value.

```typescript
generateSizes();
// → '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
```

### computeHeight(width, aspectRatio?)

Computes height from width and aspect ratio.

```typescript
computeHeight(1200, '16:9'); // → 675
computeHeight(1200, '4:3');  // → 900
```

### buildImageObject(article, siteUrl?)

Builds a structured image object from article data (for JSON-LD).

```typescript
const image = buildImageObject(article, 'https://example.com');
// → { url: '...', width: 1200, height: 630 }
```

### Constants

```typescript
DEFAULT_WIDTHS = [320, 640, 960, 1280, 1920];

ASPECT_RATIOS = {
  '16:9': 16 / 9,
  '4:3': 4 / 3,
  '1:1': 1,
  '3:2': 3 / 2,
};
```

### isExternalImage(src)

Checks if an image URL points to an external domain.

```typescript
isExternalImage('https://cdn.example.com/photo.jpg'); // → true
isExternalImage('/images/photo.jpg');                  // → false
```

### getExternalOrigin(src)

Extracts the origin from an external image URL.

```typescript
getExternalOrigin('https://cdn.example.com/photo.jpg');
// → 'https://cdn.example.com'
```
