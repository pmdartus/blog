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

export const collections = {
  posts,
};
