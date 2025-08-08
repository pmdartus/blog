import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

import remarkToc from "remark-toc";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeExternalLinks from "rehype-external-links";

export default defineConfig({
  site: "https://pm.dartus.fr",
  integrations: [sitemap()],
  image: {
    responsiveStyles: true,
    layout: "constrained",
  },
  markdown: {
    remarkPlugins: [remarkToc],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: "append",
          properties: {
            className: ["subheading-anchor"],
            ariaLabel: "Link to section",
          },
        },
      ],
      [
        rehypeExternalLinks,
        {
          target: "_blank",
          rel: ["noopener", "noreferrer"],
        },
      ],
    ],
  },
  build: {
    // The theme styles are less than 2kb, so we should inline them in the generated HTML.
    inlineStylesheets: "always",
  },
});
