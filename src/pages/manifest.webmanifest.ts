import type { APIRoute } from "astro";

import { SITE } from "../site";

export const GET: APIRoute = () => {
  const icons = [
    {
      src: "/android-chrome-192x192.png",
      sizes: "192x192",
      type: "image/png",
    },
    {
      src: "/android-chrome-512x512.png",
      sizes: "512x512",
      type: "image/png",
    },
  ];

  const manifest = {
    name: SITE.title,
    short_name: SITE.title,
    description: SITE.description,
    icons: icons,
    start_url: "/",
    background_color: "#f6f7f7",
    theme_color: "#2bbc8a",
    display: "standalone",
  };

  return new Response(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
    },
  });
};
