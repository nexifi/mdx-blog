import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCalendar,
  IconTag,
  IconCheck,
  IconSpinner,
  IconEmail,
  IconFacebook,
  IconTwitter,
  IconLinkedin,
} from "./Icons";

describe("Icon components", () => {
  const icons = [
    { name: "IconArrowLeft", Component: IconArrowLeft },
    { name: "IconArrowRight", Component: IconArrowRight },
    { name: "IconCalendar", Component: IconCalendar },
    { name: "IconTag", Component: IconTag },
    { name: "IconCheck", Component: IconCheck },
    { name: "IconSpinner", Component: IconSpinner },
    { name: "IconEmail", Component: IconEmail },
    { name: "IconFacebook", Component: IconFacebook },
    { name: "IconTwitter", Component: IconTwitter },
    { name: "IconLinkedin", Component: IconLinkedin },
  ];

  icons.forEach(({ name, Component }) => {
    it(`${name} should render an SVG element`, () => {
      const { container } = render(<Component />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it(`${name} should accept className prop`, () => {
      const { container } = render(<Component className="test-class" />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("test-class");
    });
  });
});
