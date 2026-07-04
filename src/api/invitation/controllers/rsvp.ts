import type { Core } from '@strapi/strapi';

const CODE_PATTERN = /^\d{6}$/;
const MEAL_CHOICES = ['standard', 'vegetarian', 'vegan', 'allergie'];
const AGE_GROUPS = ['adult', 'child', 'baby'];
const MAX_GUESTS = 10;

const INVITATION_UID = 'api::invitation.invitation';

function sanitizeInvitation(invitation: Record<string, unknown>) {
  const { code, guests, ...rest } = invitation;
  return rest;
}

async function findInvitationByCode(strapi: Core.Strapi, rawCode: unknown) {
  const code = String(rawCode ?? '').trim();
  if (!CODE_PATTERN.test(code)) return null;

  return strapi.documents(INVITATION_UID).findFirst({
    filters: { code },
    populate: { guests: true },
  });
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async verify(ctx: any) {
    const invitation = await findInvitationByCode(strapi, ctx.request.body?.code);

    if (!invitation) {
      ctx.status = 404;
      ctx.body = { error: 'invalid_code' };
      return;
    }

    ctx.body = {
      invitation: sanitizeInvitation(invitation),
      guests: invitation.guests ?? [],
    };
  },

  async submit(ctx: any) {
    const invitation = await findInvitationByCode(strapi, ctx.request.body?.code);

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

    const rawGuests = Array.isArray(ctx.request.body?.guests) ? ctx.request.body.guests : [];
    const messageToCouple =
      typeof ctx.request.body?.message === 'string' ? ctx.request.body.message : undefined;

    const maxGuests =
      Number.isInteger(invitation.maxGuests) && invitation.maxGuests > 0
        ? Math.min(invitation.maxGuests, MAX_GUESTS)
        : MAX_GUESTS;

    const guests = rawGuests.slice(0, maxGuests).map((entry: any) => ({
      firstName: typeof entry?.firstName === 'string' ? entry.firstName : '',
      lastName: typeof entry?.lastName === 'string' ? entry.lastName : '',
      attending: Boolean(entry?.attending),
      mealChoice: MEAL_CHOICES.includes(entry?.mealChoice) ? entry.mealChoice : null,
      allergies: typeof entry?.allergies === 'string' ? entry.allergies : null,
      ageGroup: AGE_GROUPS.includes(entry?.ageGroup) ? entry.ageGroup : 'adult',
    }));

    const attendees = guests.filter((guest) => guest.attending);

    await strapi.documents(INVITATION_UID).update({
      documentId: invitation.documentId,
      data: {
        guests,
        rsvpStatus: attendees.length > 0 ? 'confirmed' : 'declined',
        confirmedAdultCount: attendees.filter((guest) => guest.ageGroup === 'adult').length,
        confirmedChildCount: attendees.filter((guest) => guest.ageGroup === 'child').length,
        confirmedBabyCount: attendees.filter((guest) => guest.ageGroup === 'baby').length,
        respondedAt: new Date().toISOString(),
        ...(messageToCouple !== undefined ? { messageToCouple } : {}),
      } as any,
    });

    ctx.body = { success: true };
  },
});
