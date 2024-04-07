import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIRoute } from "astro";

import { SITE } from "../site";

export const GET: APIRoute = async (context) => {
  const posts = await getCollection("posts");

  return rss({
    title: `Posts Feed - ${SITE.title}`,
    description: SITE.description,
    site: context.site!,

    items: posts
      .filter((posts) => !posts.data.draft)
      .map((post) => ({
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.publishDate,
        link: `/posts/${post.slug}/`,
      })),
  });
};
