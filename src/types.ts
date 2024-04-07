export type PageType = "page" | "post";

interface AbstractMeta<T extends PageType> {
  type: T;
  title: string;
  description: string;
  ogImage?: URL | string;
}

export type PageMeta = AbstractMeta<"page">;
export type PostMeta = AbstractMeta<"post"> & {
  publishDate: Date;
}

export type Meta = PageMeta | PostMeta;

export interface Navigation {
  title: string;
  url: string;
}

export type NavigationList = Navigation[];

export interface SocialAccount {
  platform: string;
  label: string;
  url: string;
}

export type SocialAccounts = SocialAccount[];
