import type { NavigationList, SocialAccounts } from "./types";

export const SITE = {
  title: "pmdartus",
  author: {
    name: "Pierre-Marie Dartus",
    username: "pmdartus",
    twitterHandle: "@pmdartus",
  },
  description:
    "I'm Pierre-Marie Dartus, a Software Architect. This website is my space to share knowledge on web development, JavaScript, and performance.",
  locale: {
    lang: "en",
    ogLocale: "en_US",
  },
};

export const NAVIGATION: NavigationList = [
  {
    title: "Home",
    url: "/",
  },
  {
    title: "Posts",
    url: "/posts/",
  },
  {
    title: "Books",
    url: "/books/",
  },
  {
    title: "About",
    url: "/about/",
  },
];

export const SOCIAL: SocialAccounts = [
  {
    platform: "github",
    label: "GitHub",
    url: "https://github.com/pmdartus",
  },
  {
    platform: "linkedin",
    label: "LinkedIn",
    url: "https://www.linkedin.com/in/pmdartus/",
  },
  {
    platform: "twitter",
    label: "Twitter",
    url: "https://twitter.com/pmdartus",
  },
];
