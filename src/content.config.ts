import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";
import { z } from "astro/zod";

const posts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string().max(80),
    description: z.string(),
    publishDate: z.date(),
    updateDate: z.date().optional(),
    draft: z.boolean().default(false),
  }),
});

const books = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/books" }),
  schema: z.object({
    title: z.string(),
    author: z.string(),
    readingDate: z.date(),
    rating: z.number().min(1).max(5).optional(),
  }),
});

export const collections = {
  posts,
  books,
};
