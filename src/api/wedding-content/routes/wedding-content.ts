export default {
  routes: [
    {
      method: 'GET',
      path: '/wedding-content',
      handler: 'wedding-content.find',
      config: {
        auth: false,
        policies: [],
      },
    },
  ],
};
