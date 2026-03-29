import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ArticlePlaceholder, getIconForCategory } from './ArticlePlaceholder';

describe('ArticlePlaceholder', () => {
  it('should render with category text', () => {
    const { container } = render(
      <ArticlePlaceholder
        category="Guide"
        icon={<span data-testid="icon">📚</span>}
      />,
    );

    expect(container.textContent).toContain('GUIDE');
  });

  it('should render icon', () => {
    render(
      <ArticlePlaceholder
        category="Actualité"
        icon={<span data-testid="icon">📰</span>}
      />,
    );

    expect(screen.getByTestId('icon')).toBeDefined();
  });

  it('should use custom category styles', () => {
    const customStyles = {
      Custom: {
        background: 'linear-gradient(red, blue)',
        pattern: 'custom',
        subtitle: 'Mon sous-titre',
      },
    };

    const { container } = render(
      <ArticlePlaceholder
        category="Custom"
        icon={<span>🎨</span>}
        categoryStyles={customStyles}
      />,
    );

    expect(container.textContent).toContain('Mon sous-titre');
  });

  it('should use default style for unknown category', () => {
    const { container } = render(
      <ArticlePlaceholder
        category="Unknown"
        icon={<span>❓</span>}
      />,
    );

    expect(container.textContent).toContain('UNKNOWN');
  });
});

describe('getIconForCategory', () => {
  it('should return default icon for Guide category', () => {
    const icon = getIconForCategory('Guide');
    expect(icon).toBeDefined();
  });

  it('should return bug icon for unknown category', () => {
    const icon = getIconForCategory('RandomCategory');
    expect(icon).toBeDefined();
  });

  it('should use custom icons when provided', () => {
    const customIcons = {
      Custom: React.createElement('span', { 'data-testid': 'custom-icon' }, '✨'),
    };
    const icon = getIconForCategory('Custom', customIcons);
    expect(icon).toBeDefined();
  });

  it('should prefer custom icon over default', () => {
    const customIcons = {
      Guide: React.createElement('span', { 'data-testid': 'override' }, '📖'),
    };
    const icon = getIconForCategory('Guide', customIcons);
    // Should be the custom one (override)
    const rendered = render(React.createElement(React.Fragment, null, icon));
    expect(rendered.getByTestId('override')).toBeDefined();
  });
});
