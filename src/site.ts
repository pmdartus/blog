import type { Site, NavigationList, SocialAccounts } from "./types";

export const SITE: Site = {
  title: "pmdartus",
  author: {
    name: "Pierre-Marie Dartus",
    username: "pmdartus",
  },
  description:
    "Pierre-Marie Dartus is a software engineer working at Salesforce. He primarily works on web platform tooling and performance optimizations.",
};

export const NAVIGATION: NavigationList = [
  {
    title: "Home",
    url: "/",
  },
  {
    title: "Posts",
    url: "/posts",
  },
  {
    title: "About",
    url: "/about",
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
