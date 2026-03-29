import React, { ReactNode } from "react";
import { MDXProvider as BaseMDXProvider } from "@mdx-js/react";
import Link from "next/link";
import {
  IconCheck,
  IconWarning,
  IconInfo,
  IconLightbulb,
} from "./Icons";

// Import des widgets enrichis
import {
  Newsletter,
  TableOfContents,
  AuthorBio,
  ProductCard,
  RelatedPosts,
  StatsBox,
  FeatureList,
} from "./Widgets";

// Composants MDX réutilisables

interface ArticleCTAProps {
  title?: string;
  description?: string;
  primaryLink?: string;
  primaryText?: string;
  secondaryLink?: string | null;
  secondaryText?: string;
  variant?: "primary" | "secondary" | "success";
}

export const ArticleCTA: React.FC<ArticleCTAProps> = ({
  title = "Besoin d'aide ?",
  description = "Contactez-nous pour plus d'informations",
  primaryLink = "/contact",
  primaryText = "Nous contacter",
  secondaryLink = null,
  secondaryText = "En savoir plus",
  variant = "primary",
}) => {
  const variants = {
    primary: "bg-blue-600 text-white",
    secondary: "bg-blue-50 border-l-4 border-blue-500 text-gray-900",
    success: "bg-green-50 border-l-4 border-green-500 text-gray-900",
  };

  const buttonVariants = {
    primary: "bg-white text-blue-600 hover:bg-gray-100",
    secondary: "bg-blue-600 hover:bg-blue-700 text-white",
    success: "bg-green-500 hover:bg-green-600 text-white",
  };

  return (
    <div className={`${variants[variant]} p-6 rounded-lg my-8 shadow-md`}>
      <h3 className="font-bold text-xl mb-2">{title}</h3>
      <p className="mb-4">{description}</p>
      <div className="flex flex-wrap gap-3">
        <Link
          href={primaryLink}
          className={`inline-block ${buttonVariants[variant]} font-bold py-3 px-6 rounded-lg shadow-md transition-colors`}
        >
          {primaryText}
        </Link>
        {secondaryLink && (
          <a
            href={secondaryLink}
            className="inline-block bg-white/20 hover:bg-white/30 font-bold py-3 px-6 rounded-lg transition-colors"
          >
            {secondaryText}
          </a>
        )}
      </div>
    </div>
  );
};

interface AlertProps {
  type?: "info" | "warning" | "success" | "danger" | "tip";
  title?: string;
  children: ReactNode;
}

export const Alert: React.FC<AlertProps> = ({
  type = "info",
  title,
  children,
}) => {
  const types = {
    info: {
      bg: "bg-blue-50 border-blue-500",
      text: "text-blue-700",
      icon: <IconInfo className="text-blue-500" />,
    },
    warning: {
      bg: "bg-yellow-50 border-yellow-500",
      text: "text-yellow-700",
      icon: <IconWarning className="text-yellow-500" />,
    },
    success: {
      bg: "bg-green-50 border-green-500",
      text: "text-green-700",
      icon: <IconCheck className="text-green-500" />,
    },
    danger: {
      bg: "bg-red-50 border-red-500",
      text: "text-red-700",
      icon: <IconWarning className="text-red-500" />,
    },
    tip: {
      bg: "bg-purple-50 border-purple-500",
      text: "text-purple-700",
      icon: <IconLightbulb className="text-purple-500" />,
    },
  };

  const config = types[type];

  return (
    <div className={`${config.bg} border-l-4 p-4 my-6 rounded-r-lg`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3 mt-1">{config.icon}</div>
        <div className="flex-1">
          {title && (
            <h3 className={`font-bold text-lg ${config.text} mb-2`}>{title}</h3>
          )}
          <div className={config.text}>{children}</div>
        </div>
      </div>
    </div>
  );
};

// Composants HTML stylisés pour MDX
const components: Record<string, React.ComponentType<any>> = {
  // Composants personnalisés (basiques)
  ArticleCTA,
  Alert,

  // Widgets enrichis
  Newsletter,
  TableOfContents,
  AuthorBio,
  ProductCard,
  RelatedPosts,
  StatsBox,
  FeatureList,

  // Éléments HTML stylisés
  h1: (props: any) => (
    <h1 className="text-4xl font-bold mt-8 mb-4 text-gray-900" {...props} />
  ),
  h2: (props: any) => (
    <h2 className="text-3xl font-bold mt-8 mb-4 text-gray-900" {...props} />
  ),
  h3: (props: any) => (
    <h3 className="text-2xl font-bold mt-6 mb-3 text-gray-900" {...props} />
  ),
  h4: (props: any) => (
    <h4 className="text-xl font-bold mt-4 mb-2 text-gray-900" {...props} />
  ),
  p: (props: any) => (
    <p className="my-4 leading-relaxed text-gray-700" {...props} />
  ),
  ul: (props: any) => (
    <ul className="my-4 ml-6 list-disc space-y-2 text-gray-700" {...props} />
  ),
  ol: (props: any) => (
    <ol className="my-4 ml-6 list-decimal space-y-2 text-gray-700" {...props} />
  ),
  li: (props: any) => <li className="leading-relaxed" {...props} />,
  a: (props: any) => {
    const isInternal = props.href?.startsWith("/");
    if (isInternal) {
      return (
        <Link
          href={props.href}
          className="text-blue-600 hover:underline font-medium"
          {...props}
        />
      );
    }
    return (
      <a
        className="text-blue-600 hover:underline font-medium"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      />
    );
  },
  blockquote: (props: any) => (
    <blockquote
      className="border-l-4 border-blue-600 pl-4 italic my-6 text-gray-700"
      {...props}
    />
  ),
  code: (props: any) => {
    if (!props.className) {
      return (
        <code
          className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800"
          {...props}
        />
      );
    }
    return (
      <code
        className="block bg-gray-900 text-gray-100 p-4 rounded-lg my-4 overflow-x-auto"
        {...props}
      />
    );
  },
  pre: (props: any) => (
    <pre
      className="bg-gray-900 text-gray-100 p-4 rounded-lg my-4 overflow-x-auto"
      {...props}
    />
  ),
  table: (props: any) => (
    <div className="my-8 overflow-x-auto">
      <table
        className="min-w-full bg-white rounded-lg overflow-hidden shadow-md"
        {...props}
      />
    </div>
  ),
  thead: (props: any) => (
    <thead className="bg-blue-600 text-white" {...props} />
  ),
  th: (props: any) => (
    <th className="px-6 py-3 text-left font-bold" {...props} />
  ),
  td: (props: any) => (
    <td
      className="px-6 py-4 border-b border-gray-200 text-gray-700"
      {...props}
    />
  ),
  img: (props: any) => (
    <img
      className="rounded-lg shadow-md my-6 w-full"
      alt={props.alt || ""}
      {...props}
    />
  ),
  hr: (props: any) => <hr className="my-8 border-gray-300" {...props} />,
  strong: (props: any) => (
    <strong className="font-bold text-gray-900" {...props} />
  ),
  em: (props: any) => <em className="italic" {...props} />,
};

interface MDXProviderProps {
  children: ReactNode;
}

export function MDXProvider({ children }: MDXProviderProps) {
  return <BaseMDXProvider components={components}>{children}</BaseMDXProvider>;
}

export default MDXProvider;
