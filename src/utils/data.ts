import { getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";

export type Post = CollectionEntry<"posts">;

interface QueryOptions {
  limit?: number;
  offset?: number;
}

export async function getPosts({
  limit,
  offset = 0,
}: QueryOptions): Promise<Post[]> {
  let posts = await getCollection("posts", ({ data }) => !data.draft);

  posts = posts.toSorted((a, b) => {
    return b.data.publishDate.getTime() - a.data.publishDate.getTime();
  });

  return posts.slice(offset, offset + (limit ?? posts.length));
}
