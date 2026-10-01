import type { PublishableContent } from "./model";

export function isPubliclyVisible<T extends PublishableContent>(item: T): boolean {
  return item.status === "published" && item.visibility === "public";
}

export function getPublishedPublicItems<T extends PublishableContent>(items: readonly T[]): T[] {
  return items.filter(isPubliclyVisible);
}
