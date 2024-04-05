import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

import remarkToc from "remark-toc";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

export default defineConfig({
  site: "https://pm.dartus.fr",
  // redirects: {
  //     '/blog/[...slug]': '/posts/[...slug]',
  // }
  integrations: [sitemap()],
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
    ],
  },
  build: {
    // The theme styles are less than 2kb, so we should inline them in the generated HTML.
    inlineStylesheets: "always",
  },
});
