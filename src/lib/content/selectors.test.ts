import { describe, expect, it } from "vitest";
import type { PublishableContent } from "./model";
import { getPublishedPublicItems } from "./selectors";

describe("getPublishedPublicItems", () => {
  it("returns only public, published records", () => {
    const records: PublishableContent[] = [
      {
        id: "published",
        slug: "published",
        status: "published",
        visibility: "public",
        publishedAt: "2026-09-29T08:00:00+08:00",
      },
      {
        id: "draft",
        slug: "draft",
        status: "draft",
        visibility: "public",
        publishedAt: null,
      },
      {
        id: "private",
        slug: "private",
        status: "published",
        visibility: "private",
        publishedAt: "2026-09-29T08:00:00+08:00",
      },
    ];

    expect(getPublishedPublicItems(records).map((record) => record.id)).toEqual(["published"]);
  });
});
