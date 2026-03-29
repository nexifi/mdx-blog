import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useArticles, useArticle, useCategories, useRelatedArticles, usePagination, useArticlesByTag, useSearch } from './hooks';
import { BlogProvider } from './provider';
import type { Article, BlogApiConfig } from './types';

// Stub window.scrollTo which is not implemented in jsdom
beforeEach(() => {
  window.scrollTo = vi.fn() as any;
});
afterEach(() => {
  vi.restoreAllMocks();
});

// Mock SWR to avoid real fetching
vi.mock('swr', () => {
  const actual = vi.importActual('swr');
  return {
    ...actual,
    default: vi.fn(),
  };
});

import useSWR from 'swr';
const mockUseSWR = vi.mocked(useSWR);

const mockArticles: Article[] = [
  {
    slug: 'article-1',
    title: 'Premier article',
    date: '2024-06-15',
    category: 'Guide',
    excerpt: 'Résumé 1',
    tags: ['nuisibles', 'prévention'],
    published: true,
  },
  {
    slug: 'article-2',
    title: 'Deuxième article',
    date: '2024-06-10',
    category: 'Actualité',
    excerpt: 'Résumé 2',
    tags: ['cafards'],
    published: true,
  },
  {
    slug: 'article-3',
    title: 'Troisième article',
    date: '2024-06-01',
    category: 'Guide',
    excerpt: 'Résumé 3',
    tags: ['rats'],
    published: true,
  },
];

function createWrapper(config?: Partial<BlogApiConfig>) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      BlogProvider,
      {
        config: {
          endpoints: { articles: '/articles' },
          ...config,
        },
        children,
      },
    );
}

describe('useArticles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return articles from SWR', () => {
    mockUseSWR.mockReturnValue({
      data: mockArticles,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    } as any);

    const { result } = renderHook(() => useArticles(), {
      wrapper: createWrapper(),
    });

    expect(result.current.articles).toEqual(mockArticles);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('should return empty array when data is undefined', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      isValidating: false,
      mutate: vi.fn(),
    } as any);

    const { result } = renderHook(() => useArticles(), {
      wrapper: createWrapper(),
    });

    expect(result.current.articles).toEqual([]);
    expect(result.current.isLoading).toBe(true);
  });

  it('should return error state', () => {
    const error = new Error('Network error');
    mockUseSWR.mockReturnValue({
      data: undefined,
      error,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    } as any);

    const { result } = renderHook(() => useArticles(), {
      wrapper: createWrapper(),
    });

    expect(result.current.error).toBe(error);
  });
});

describe('useArticle', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should return single article', () => {
    mockUseSWR.mockReturnValue({
      data: mockArticles[0],
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    } as any);

    const { result } = renderHook(() => useArticle('article-1'), {
      wrapper: createWrapper(),
    });

    expect(result.current.article).toEqual(mockArticles[0]);
  });

  it('should not fetch when slug is null', () => {
    mockUseSWR.mockReturnValue({
      data: null,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    } as any);

    const { result } = renderHook(() => useArticle(null), {
      wrapper: createWrapper(),
    });

    // SWR key should be null
    expect(mockUseSWR).toHaveBeenCalledWith(null, expect.any(Function), expect.any(Object));
  });
});

describe('useCategories', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should return categories', () => {
    mockUseSWR.mockReturnValue({
      data: ['Guide', 'Actualité'],
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    } as any);

    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper(),
    });

    expect(result.current.categories).toEqual(['Guide', 'Actualité']);
  });

  it('should return empty array when data is undefined', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      isValidating: false,
      mutate: vi.fn(),
    } as any);

    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper(),
    });

    expect(result.current.categories).toEqual([]);
  });
});

describe('useRelatedArticles', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should return related articles', () => {
    mockUseSWR.mockReturnValue({
      data: [mockArticles[1]],
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    } as any);

    const { result } = renderHook(() => useRelatedArticles('article-1', 3), {
      wrapper: createWrapper(),
    });

    expect(result.current.relatedArticles).toEqual([mockArticles[1]]);
  });

  it('should not fetch when slug is null', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    } as any);

    renderHook(() => useRelatedArticles(null), {
      wrapper: createWrapper(),
    });

    expect(mockUseSWR).toHaveBeenCalledWith(null, expect.any(Function), expect.any(Object));
  });
});

describe('useArticlesByTag', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should return articles by tag', () => {
    mockUseSWR.mockReturnValue({
      data: [mockArticles[0]],
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    } as any);

    const { result } = renderHook(() => useArticlesByTag('nuisibles'), {
      wrapper: createWrapper(),
    });

    expect(result.current.articles).toEqual([mockArticles[0]]);
  });

  it('should not fetch when tag is null', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    } as any);

    renderHook(() => useArticlesByTag(null), {
      wrapper: createWrapper(),
    });

    expect(mockUseSWR).toHaveBeenCalledWith(null, expect.any(Function), expect.any(Object));
  });
});

describe('usePagination', () => {
  beforeEach(() => vi.clearAllMocks());

  // usePagination calls useArticles internally, which calls useSWR
  // We need to handle multiple useSWR calls
  it('should paginate articles', () => {
    mockUseSWR.mockReturnValue({
      data: mockArticles,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    } as any);

    const { result } = renderHook(() => usePagination({ perPage: 2 }), {
      wrapper: createWrapper(),
    });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.pagination.totalPages).toBe(2);
    expect(result.current.pagination.totalItems).toBe(3);
    expect(result.current.pagination.hasNext).toBe(true);
    expect(result.current.pagination.hasPrevious).toBe(false);
  });

  it('should filter by category', () => {
    mockUseSWR.mockReturnValue({
      data: mockArticles,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    } as any);

    const { result } = renderHook(() => usePagination({ perPage: 10, category: 'Guide' }), {
      wrapper: createWrapper(),
    });

    expect(result.current.items).toHaveLength(2); // 2 Guide articles
    expect(result.current.pagination.totalItems).toBe(2);
  });

  it('should change page', () => {
    mockUseSWR.mockReturnValue({
      data: mockArticles,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    } as any);

    const { result } = renderHook(() => usePagination({ perPage: 2 }), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setPage(2);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.pagination.currentPage).toBe(2);
    expect(result.current.pagination.hasPrevious).toBe(true);
    expect(result.current.pagination.hasNext).toBe(false);
  });

  it('should change category and reset page', () => {
    mockUseSWR.mockReturnValue({
      data: mockArticles,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    } as any);

    const { result } = renderHook(() => usePagination({ perPage: 10 }), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setPage(2);
    });

    act(() => {
      result.current.setCategory('Guide');
    });

    expect(result.current.category).toBe('Guide');
    expect(result.current.pagination.currentPage).toBe(1); // Reset to 1
  });
});

describe('useSearch', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should return all articles when query is empty', () => {
    mockUseSWR.mockReturnValue({
      data: mockArticles,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    } as any);

    const { result } = renderHook(() => useSearch(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.results).toEqual(mockArticles);
    expect(result.current.totalResults).toBe(3);
  });

  it('should filter articles by title', () => {
    mockUseSWR.mockReturnValue({
      data: mockArticles,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    } as any);

    const { result } = renderHook(() => useSearch('Premier'), {
      wrapper: createWrapper(),
    });

    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0].slug).toBe('article-1');
  });

  it('should filter by tags', () => {
    mockUseSWR.mockReturnValue({
      data: mockArticles,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    } as any);

    const { result } = renderHook(() => useSearch('cafards'), {
      wrapper: createWrapper(),
    });

    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0].slug).toBe('article-2');
  });

  it('should require all search terms to match', () => {
    mockUseSWR.mockReturnValue({
      data: mockArticles,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    } as any);

    const { result } = renderHook(() => useSearch('premier cafards'), {
      wrapper: createWrapper(),
    });

    // Both terms must match — no article has both
    expect(result.current.results).toHaveLength(0);
  });

  it('should return all for query shorter than minLength', () => {
    mockUseSWR.mockReturnValue({
      data: mockArticles,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    } as any);

    const { result } = renderHook(() => useSearch('a', { minLength: 3 }), {
      wrapper: createWrapper(),
    });

    expect(result.current.results).toEqual(mockArticles);
  });
});
