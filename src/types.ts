export interface Site {
  author: {
    name: string;
    username: string;
  };
  description: string;
  title: string;
}

export interface Navigation {
  title: string;
  url: string;
}

export type NavigationList = Navigation[];

export type SocialPlatform = "linkedin" | "github" | "twitter";

export interface SocialAccount {
  platform: SocialPlatform;
  label: string;
  url: string;
}

export type SocialAccounts = SocialAccount[];
