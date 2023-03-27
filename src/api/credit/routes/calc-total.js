module.exports = {
  routes: [
    {
      method: "GET",
      path: "/profile/:profile_id/credits/total",
      handler: "credit.calcTotal",
    },
  ],
};
