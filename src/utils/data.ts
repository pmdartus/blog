import { getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";

export type Post = CollectionEntry<"posts">;
export type Book = CollectionEntry<"books">;

interface QueryOptions {
  limit?: number;
  offset?: number;
}

export async function getPosts(options: QueryOptions = {}): Promise<Post[]> {
  const { limit, offset = 0 } = options;

  let posts = await getCollection("posts", ({ data }) => !data.draft);

  posts = posts.toSorted((a, b) => {
    return b.data.publishDate.getTime() - a.data.publishDate.getTime();
  });

  return posts.slice(offset, offset + (limit ?? posts.length));
}

export async function getBooks(): Promise<Book[]> {
  const books = await getCollection("books");

  return books.sort(
    (a, b) => b.data.readingDate.getTime() - a.data.readingDate.getTime(),
  );
}
