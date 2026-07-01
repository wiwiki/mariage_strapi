import type { Core } from '@strapi/strapi';

const CODE_PATTERN = /^\d{6}$/;
const MEAL_CHOICES = ['standard', 'vegetarian', 'vegan', 'allergie'];

function sanitizeInvitation(invitation: Record<string, unknown>) {
  const { code, guests, ...rest } = invitation;
  return rest;
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async verify(ctx: any) {
    const code = String(ctx.request.body?.code ?? '').trim();

    const invitation = CODE_PATTERN.test(code)
      ? await strapi.db.query('api::invitation.invitation').findOne({
          where: { code },
          populate: { guests: true },
        })
      : null;

    if (!invitation) {
      ctx.status = 404;
      ctx.body = { error: 'invalid_code' };
      return;
    }

    ctx.body = {
      invitation: sanitizeInvitation(invitation),
      guests: invitation.guests,
    };
  },

  async submit(ctx: any) {
    const code = String(ctx.request.body?.code ?? '').trim();
    const guestAnswers = Array.isArray(ctx.request.body?.guests) ? ctx.request.body.guests : [];
    const messageToCouple =
      typeof ctx.request.body?.messageToCouple === 'string' ? ctx.request.body.messageToCouple : undefined;

    const invitation = CODE_PATTERN.test(code)
      ? await strapi.db.query('api::invitation.invitation').findOne({
          where: { code },
          populate: { guests: true },
        })
      : null;

    if (!invitation) {
      ctx.status = 404;
      ctx.body = { error: 'invalid_code' };
      return;
    }

    if (invitation.rsvpStatus !== 'pending') {
      ctx.status = 409;
      ctx.body = { error: 'already_responded' };
      return;
    }

    const guestById = new Map((invitation.guests as any[]).map((guest) => [guest.id, guest]));

    for (const answer of guestAnswers) {
      const guest = guestById.get(answer?.id);
      if (!guest) continue;

      const data: Record<string, unknown> = {
        attending: Boolean(answer.attending),
      };

      if (answer.attending) {
        if (MEAL_CHOICES.includes(answer.mealChoice)) {
          data.mealChoice = answer.mealChoice;
        }
        if (typeof answer.allergies === 'string') {
          data.allergies = answer.allergies;
        }
      }

      if (guest.isOpenSlot) {
        if (typeof answer.firstName === 'string') data.firstName = answer.firstName;
        if (typeof answer.lastName === 'string') data.lastName = answer.lastName;
      }

      await strapi.db.query('api::guest.guest').update({
        where: { id: guest.id },
        data,
      });
    }

    const refreshedGuests = await strapi.db.query('api::guest.guest').findMany({
      where: { invitation: invitation.id },
    });

    const confirmedGuestCount = refreshedGuests.filter((guest: any) => guest.attending).length;
    const rsvpStatus = confirmedGuestCount > 0 ? 'confirmed' : 'declined';

    await strapi.db.query('api::invitation.invitation').update({
      where: { id: invitation.id },
      data: {
        rsvpStatus,
        confirmedGuestCount,
        respondedAt: new Date(),
        ...(messageToCouple !== undefined ? { messageToCouple } : {}),
      },
    });

    ctx.body = { success: true };
  },
});
