import React, { useEffect } from "react";
import marked from "marked";
import MathJax from "mathjax/es5/core.js";
import { tex } from "mathjax/es5/input/tex.js";
import { html } from "mathjax/es5/output/html.js";
import { allPackages } from "mathjax/es5/input/tex/AllPackages.js";

interface MarkdownWithMathJaxProps {
  markdownText: string;
}

const MarkdownWithMathJax: React.FC<MarkdownWithMathJaxProps> = ({
  markdownText,
}) => {
  useEffect(() => {
    // Configure MathJax
    const mathJax = MathJax.init({
      loader: { load: ["input/tex", "output/html"] },
      tex: {
        inlineMath: [
          ["$", "$"],
          ["\\(", "\\)"],
        ],
        displayMath: [
          ["$$", "$$"],
          ["\\[", "\\]"],
        ],
        packages: { "[+]": allPackages },
      },
      html: { escape: true },
    });

    // Render the MathJax content
    mathJax.typesetPromise().catch((err: any) => console.error(err));
  }, [markdownText]);

  // Convert Markdown to HTML
  const createMarkup = () => {
    return { __html: marked(markdownText) };
  };

  return (
    <div
      dangerouslySetInnerHTML={createMarkup()}
      style={{ margin: "20px", fontFamily: "Arial, sans-serif" }}
    />
  );
};

export default MarkdownWithMathJax;
