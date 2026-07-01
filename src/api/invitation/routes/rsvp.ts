export default {
  routes: [
    {
      method: 'POST',
      path: '/rsvp/verify',
      handler: 'rsvp.verify',
      config: {
        auth: false,
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/rsvp/submit',
      handler: 'rsvp.submit',
      config: {
        auth: false,
        policies: [],
      },
    },
  ],
};
