import type { Core } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    const publicRole = await strapi
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'public' } });

    if (!publicRole) return;

    const contentTypes = [
      'api::hero-banner.hero-banner',
      'api::story.story',
      'api::programme.programme',
      'api::venue.venue',
      'api::rsvp.rsvp',
      'api::footer.footer',
    ];

    for (const contentType of contentTypes) {
      const action = `${contentType}.find`;

      const existingPermission = await strapi
        .query('plugin::users-permissions.permission')
        .findOne({ where: { role: publicRole.id, action } });

      if (!existingPermission) {
        await strapi
          .query('plugin::users-permissions.permission')
          .create({ data: { action, role: publicRole.id } });
      }
    }
  },
};
