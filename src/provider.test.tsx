import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BlogProvider, useLabels } from "./provider";

// Test component that uses useLabels
function LabelDisplay() {
  const labels = useLabels();
  return (
    <div>
      <span data-testid="home">{labels.home}</span>
      <span data-testid="blog">{labels.blog}</span>
      <span data-testid="readMore">{labels.readMore}</span>
    </div>
  );
}

describe("BlogProvider", () => {
  const defaultConfig = {
    endpoints: { articles: "/api/articles" },
  };

  it("should render children", () => {
    render(
      <BlogProvider config={defaultConfig}>
        <div data-testid="child">Hello</div>
      </BlogProvider>
    );
    expect(screen.getByTestId("child")).toHaveTextContent("Hello");
  });

  it("should provide default French labels", () => {
    render(
      <BlogProvider config={defaultConfig}>
        <LabelDisplay />
      </BlogProvider>
    );
    expect(screen.getByTestId("home")).toHaveTextContent("Accueil");
    expect(screen.getByTestId("blog")).toHaveTextContent("Blog");
    expect(screen.getByTestId("readMore")).toHaveTextContent("Lire la suite");
  });

  it("should allow overriding labels", () => {
    render(
      <BlogProvider
        config={defaultConfig}
        labels={{ home: "Home", blog: "Blog EN", readMore: "Read more" }}
      >
        <LabelDisplay />
      </BlogProvider>
    );
    expect(screen.getByTestId("home")).toHaveTextContent("Home");
    expect(screen.getByTestId("blog")).toHaveTextContent("Blog EN");
    expect(screen.getByTestId("readMore")).toHaveTextContent("Read more");
  });

  it("should partially override labels (keep defaults for non-overridden)", () => {
    render(
      <BlogProvider config={defaultConfig} labels={{ home: "Home" }}>
        <LabelDisplay />
      </BlogProvider>
    );
    expect(screen.getByTestId("home")).toHaveTextContent("Home");
    // Non-overridden should keep French default
    expect(screen.getByTestId("blog")).toHaveTextContent("Blog");
    expect(screen.getByTestId("readMore")).toHaveTextContent("Lire la suite");
  });
});
