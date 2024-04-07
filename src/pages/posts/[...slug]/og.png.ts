import path from "node:path";
import fs from "node:fs/promises";

import { html } from "satori-html";
import { ImageResponse } from "@vercel/og";
import type { APIRoute, GetStaticPaths, InferGetStaticPropsType } from "astro";

import { SITE } from "../../../site";
import { getPosts } from "../../../utils/data";
import { computeReadTime } from "../../../utils/readTime";

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

const ASSETS = {
  profilePicture: "./src/assets/profile-picture.jpg",
  fonts: {
    merriweather: "./public/fonts/merriweather-v22-latin-regular.woff",
    merriweatherBold: "./public/fonts/merriweather-v22-latin-bold.woff",
  },
};

const COLORS = {
  background: "#f6f7f7",
  primary: "#2bbc8a",
  text: "#242424",
};

const ASSET_CACHE = new Map<string, Buffer>();

async function loadAsset(filename: string): Promise<Buffer> {
  let buffer = ASSET_CACHE.get(filename);

  if (!buffer) {
    buffer = await fs.readFile(path.resolve(process.cwd(), filename));
    ASSET_CACHE.set(filename, buffer);
  }

  return buffer;
}

/**
 * Retrieves the static paths for the blog posts.
 */
export const getStaticPaths = (async () => {
  const posts = await getPosts({});
  return posts.map((post) => {
    return {
      params: { slug: post.slug },
      props: { post },
    };
  });
}) satisfies GetStaticPaths;

/**
 * Generates an Open Graph image for a blog post.
 *
 * @param ctx - The API route context.
 * @returns An ImageResponse object containing the generated image.
 */
export const GET: APIRoute<Props> = async (ctx) => {
  const { post } = ctx.props;

  const [Merriweather, MerriweatherBold, profilePicture] = await Promise.all([
    loadAsset(ASSETS.fonts.merriweather),
    loadAsset(ASSETS.fonts.merriweatherBold),
    loadAsset(ASSETS.profilePicture),
  ]);

  const readTime = computeReadTime(post.body);
  const formattedPublishDate = post.data.publishDate.toLocaleDateString(
    "en-us",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  );

  // Convert the profile picture to a base64-encoded data URL. This is bottleneck for og image
  // generation. This should be optimized in the future to avoid unnecessary base64 encoding.
  const profilePictureData = `data:image/jpeg;base64, ${profilePicture.toString("base64")}`;

  const content = html`
    <div
      style="
        display: flex; 
        flex-direction: column; 
        width: 100%; 
        height: 100%; 
        color: ${COLORS.text}; 
        background: ${COLORS.background}; 
        border: 20px solid ${COLORS.primary};
        font-weight: 500;
        padding: 60px;
      "
    >
      <div style="display: flex; flex-direction: column; flex: 1;">
        <div style="font-size: 32px;">
          ${formattedPublishDate} • ${readTime} minute${readTime > 1 ? "s" : ""}
          read
        </div>
        <div
          style="
            font-size: 64px;
            color: ${COLORS.primary};
            font-weight: 700;
            margin-top: 24px;
          "
        >
          ${post.data.title}
        </div>
      </div>

      <div
        style="
          display: flex; 
          align-items: center; 
          gap: 24px;
        "
      >
        <img
          src="${profilePictureData}"
          style="width: 150px; height: 150px; border-radius: 10px;"
        />
        <div
          style="
            display: flex; 
            flex-direction: column; 
            gap: 12px;
          "
        >
          <div style="font-size: 32px;">${SITE.author.name}</div>
          <div style="font-size: 24px;">@${SITE.author.username}</div>
        </div>
      </div>
    </div>
  `;

  return new ImageResponse(content, {
    // Force the image to be 1200x630 pixels, which is the recommended size for Open Graph images.
    width: 1200,
    height: 630,
    fonts: [
      {
        name: "Merriweather",
        data: Merriweather.buffer,
        weight: 500,
        style: "normal",
      },
      {
        name: "Merriweather",
        data: MerriweatherBold.buffer,
        weight: 700,
        style: "normal",
      },
    ],
  });
};
