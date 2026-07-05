import type { Core } from '@strapi/strapi';

// Explicit populate per section: never populate '*' here — this endpoint is
// public and a custom controller skips Strapi's sanitization, so wildcard
// populate would leak private relations like createdBy/updatedBy.
const SECTIONS: { uid: string; populate?: Record<string, true> }[] = [
  { uid: 'api::story.story', populate: { pictureCouple: true } },
  { uid: 'api::programme.programme', populate: { programmeItems: true } },
  { uid: 'api::venue.venue', populate: { venuePhoto: true } },
  { uid: 'api::rsvp.rsvp' },
  { uid: 'api::footer.footer' },
];

// Strapi meta fields carried by every document; merging them across six
// sections would leave whichever section loads last as a meaningless winner.
const META_KEYS = new Set([
  'id',
  'documentId',
  'createdAt',
  'updatedAt',
  'publishedAt',
  'locale',
  'localizations',
  'createdBy',
  'updatedBy',
]);

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async find(ctx: any) {
    const sections = await Promise.all(
      SECTIONS.map(async ({ uid, populate }) => {
        try {
          return await strapi.documents(uid as any).findFirst({
            status: 'published',
            ...(populate ? { populate } : {}),
          });
        } catch {
          return null;
        }
      })
    );

    const merged: Record<string, unknown> = {};

    for (const section of sections) {
      if (!section) continue;

      for (const [key, value] of Object.entries(section)) {
        if (META_KEYS.has(key)) continue;
        if (value === null || value === undefined) continue;
        merged[key] = value;
      }
    }

    ctx.body = { data: merged };
  },
});
