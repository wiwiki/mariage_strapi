// Excludes easily-confused characters (0/O, 1/I/L) so codes survive being
// read from a printed card.
const CODE_CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;
const MAX_ATTEMPTS = 10;

const SITE_URL = process.env.SITE_URL || 'https://mariagefranca.sifoni.ca';

function randomCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARSET[Math.floor(Math.random() * CODE_CHARSET.length)];
  }
  return code;
}

async function ensureUniqueCode(): Promise<string> {
  const strapi = (globalThis as any).strapi;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const code = randomCode();
    const existing = await strapi.db
      .query('api::invitation.invitation')
      .findOne({ where: { code } });
    if (!existing) return code;
  }

  throw new Error('Could not generate a unique invitation code');
}

async function applyCodeAndLink(data: Record<string, any>) {
  const manual = typeof data.code === 'string' ? data.code.trim().toUpperCase() : '';
  data.code = manual || (await ensureUniqueCode());
  data.inviteLink = `${SITE_URL}/?code=${data.code}`;
}

export default {
  async beforeCreate(event: any) {
    await applyCodeAndLink(event.params.data);
  },

  async beforeUpdate(event: any) {
    // Only touch the code when the update actually carries one (admin edit);
    // RSVP submits update guests/status without sending code.
    if (event.params.data?.code !== undefined) {
      await applyCodeAndLink(event.params.data);
    }
  },
};
