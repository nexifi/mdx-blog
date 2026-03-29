import React from "react";
import {
  IconShield,
  IconBook,
  IconNewspaper,
  IconStar,
  IconWarning,
  IconBug,
} from "./Icons";

interface ArticlePlaceholderProps {
  category: string;
  title?: string;
  icon: React.ReactNode;
  /** Custom category style overrides */
  categoryStyles?: CategoryStyles;
}

type CategoryStyles = {
  [key: string]: {
    background: string;
    pattern: string;
    subtitle?: string;
  };
};

const defaultCategoryStyles: CategoryStyles = {
  Guide: {
    background:
      "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #45a049 100%)",
    pattern: "hexagon",
  },
};

export const ArticlePlaceholder: React.FC<ArticlePlaceholderProps> = ({
  category,
  title,
  icon,
  categoryStyles,
}) => {
  const mergedStyles = { ...defaultCategoryStyles, ...categoryStyles };

  const getPlaceholderStyle = (category: string) => {
    return (
      mergedStyles[category] || {
        background: "linear-gradient(135deg, #45a049 0%, #357935 100%)",
        pattern: "dots",
      }
    );
  };

  const getSubtitle = (category: string): string => {
    const style = mergedStyles[category];
    if (style?.subtitle) return style.subtitle;
    return category;
  };

  const style = getPlaceholderStyle(category);

  return (
    <div
      className="relative w-full h-48 overflow-hidden flex items-center justify-center"
      style={{ background: style.background }}
    >
      {/* Decorative shapes */}
      <div className="absolute top-6 left-8 w-20 h-12 bg-white/10 rounded-lg transform -rotate-12"></div>
      <div className="absolute bottom-8 right-6 w-16 h-16 bg-white/8 rounded-full"></div>
      <div className="absolute top-12 right-12 w-12 h-8 bg-white/12 rounded-full"></div>

      {/* Content */}
      <div className="relative z-10 text-center text-white">
        <div className="text-4xl mb-3 filter drop-shadow-lg">{icon}</div>
        <div className="text-xl font-bold mb-1 tracking-wide">
          {category.toUpperCase()}
        </div>
        <div className="text-sm opacity-90 font-medium max-w-48 mx-auto">
          {getSubtitle(category)}
        </div>
      </div>

      {/* Border decoration */}
      <div className="absolute inset-2 border-2 border-white/20 rounded-lg pointer-events-none"></div>

      {/* Bottom accent */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-white/40 rounded-full"></div>
    </div>
  );
};

/**
 * Icon map for categories. Consumers can override by passing custom icons.
 * Returns a default bug icon for unknown categories.
 */
const defaultIconMap: Record<string, React.ReactNode> = {
  Guide: <IconBook />,
};

export const getIconForCategory = (
  category: string,
  customIcons?: Record<string, React.ReactNode>,
): React.ReactNode => {
  const merged = { ...defaultIconMap, ...customIcons };
  return merged[category] || <IconBug />;
};

export default ArticlePlaceholder;
