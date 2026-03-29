import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BlogImage } from './BlogImage';

// Mock image utils
vi.mock('../utils/image', () => ({
  resolveImageUrl: (src: string, siteUrl?: string) => {
    if (!src) return '';
    if (src.startsWith('http') || src.startsWith('//') || src.startsWith('data:')) return src;
    if (siteUrl) return `${siteUrl.replace(/\/$/, '')}${src.startsWith('/') ? '' : '/'}${src}`;
    return src;
  },
  generateSrcSet: (src: string, widths: number[]) =>
    widths.map((w) => `${src}?w=${w} ${w}w`).join(', '),
  generateSizes: (breakpoints?: Record<string, string>) => {
    if (!breakpoints || Object.keys(breakpoints).length === 0) return '100vw';
    return '(max-width: 640px) 100vw, 50vw';
  },
  isExternalImage: (src: string, siteUrl?: string) => {
    if (!siteUrl || !src.startsWith('http')) return false;
    try {
      return new URL(src).origin !== new URL(siteUrl).origin;
    } catch {
      return false;
    }
  },
  DEFAULT_WIDTHS: [640, 768, 1024, 1280, 1536],
}));

describe('BlogImage', () => {
  it('should render img element with src and alt', () => {
    render(<BlogImage src="/img/hero.webp" alt="Hero image" />);
    const img = screen.getByRole('img');
    expect(img).toBeDefined();
    expect(img.getAttribute('src')).toBe('/img/hero.webp');
    expect(img.getAttribute('alt')).toBe('Hero image');
  });

  it('should apply lazy loading by default', () => {
    render(<BlogImage src="/img/hero.webp" alt="Hero" />);
    const img = screen.getByRole('img');
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.getAttribute('decoding')).toBe('async');
  });

  it('should disable lazy loading when priority is true', () => {
    render(<BlogImage src="/img/hero.webp" alt="Hero" priority />);
    const img = screen.getByRole('img');
    expect(img.getAttribute('loading')).toBeNull();
    expect(img.getAttribute('decoding')).toBe('sync');
  });

  it('should set width and height', () => {
    render(<BlogImage src="/img/hero.webp" alt="Hero" width={800} height={450} />);
    const img = screen.getByRole('img');
    expect(img.getAttribute('width')).toBe('800');
    expect(img.getAttribute('height')).toBe('450');
  });

  it('should compute height from aspectRatio', () => {
    render(<BlogImage src="/img/hero.webp" alt="Hero" width={1600} aspectRatio={16 / 9} />);
    const img = screen.getByRole('img');
    expect(img.getAttribute('height')).toBe('900');
  });

  it('should apply className', () => {
    render(<BlogImage src="/img/hero.webp" alt="Hero" className="rounded-lg" />);
    const img = screen.getByRole('img');
    expect(img.className).toContain('rounded-lg');
  });

  it('should generate srcset with custom widths', () => {
    render(<BlogImage src="/img/hero.webp" alt="Hero" srcSetWidths={[640, 1024]} />);
    const img = screen.getByRole('img');
    expect(img.getAttribute('srcset')).toContain('640w');
    expect(img.getAttribute('srcset')).toContain('1024w');
  });

  it('should resolve relative src with siteUrl', () => {
    render(<BlogImage src="/img/hero.webp" alt="Hero" siteUrl="https://example.com" />);
    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toBe('https://example.com/img/hero.webp');
  });

  it('should show error fallback on image error', () => {
    render(<BlogImage src="/img/broken.webp" alt="Broken" />);
    const img = screen.getByRole('img');
    
    // Simulate error
    fireEvent.error(img);
    
    // After error, should show fallback div
    const fallback = screen.getByRole('img');
    expect(fallback.getAttribute('aria-label')).toBe('Broken');
  });

  it('should call onError callback', () => {
    const onError = vi.fn();
    render(<BlogImage src="/img/broken.webp" alt="Broken" onError={onError} />);
    
    fireEvent.error(screen.getByRole('img'));
    expect(onError).toHaveBeenCalled();
  });

  it('should delegate to custom component when as prop provided', () => {
    const CustomImage = (props: any) => <img data-testid="custom" {...props} />;
    render(
      <BlogImage src="/img/hero.webp" alt="Hero" as={CustomImage} width={800} height={450} />,
    );
    expect(screen.getByTestId('custom')).toBeDefined();
  });

  it('should add crossOrigin for external images', () => {
    render(
      <BlogImage
        src="https://cdn.other.com/img.webp"
        alt="External"
        siteUrl="https://example.com"
      />,
    );
    const img = screen.getByRole('img');
    expect(img.getAttribute('crossorigin')).toBe('anonymous');
  });

  it('should set sizes from breakpoint map', () => {
    render(
      <BlogImage
        src="/img/hero.webp"
        alt="Hero"
        sizes={{ sm: '100vw', md: '50vw' }}
        srcSetWidths={[640]}
      />,
    );
    const img = screen.getByRole('img');
    expect(img.getAttribute('sizes')).toBeTruthy();
  });

  it('should set sizes from string', () => {
    render(
      <BlogImage src="/img/hero.webp" alt="Hero" sizes="(max-width: 800px) 100vw, 50vw" srcSetWidths={[640]} />
    );
    const img = screen.getByRole('img');
    expect(img.getAttribute('sizes')).toBe('(max-width: 800px) 100vw, 50vw');
  });

  it('should apply blur placeholder styles', () => {
    const blurUrl = 'data:image/jpeg;base64,abc';
    render(
      <BlogImage
        src="/img/hero.webp"
        alt="Hero"
        blurDataURL={blurUrl}
        placeholder="blur"
      />,
    );
    const img = screen.getByRole('img');
    expect(img.className).toContain('transition-opacity');
  });

  it('should render with id', () => {
    render(<BlogImage src="/img/hero.webp" alt="Hero" id="my-image" />);
    const img = screen.getByRole('img');
    expect(img.getAttribute('id')).toBe('my-image');
  });
});
