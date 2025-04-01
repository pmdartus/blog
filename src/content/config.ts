import { z, defineCollection } from "astro:content";

const posts = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string().max(80),
    description: z.string(),
    publishDate: z.date(),
    updateDate: z.date().optional(),
    draft: z.boolean().default(false),
  }),
});

const books = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    author: z.string(),
    readingDate: z.date(),
    rating: z.number().min(1).max(5),
  }),
});

export const collections = {
  posts,
  books,
};
