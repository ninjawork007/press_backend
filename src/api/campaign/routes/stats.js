module.exports = {
  routes: [
    {
      method: "GET",
      path: "/stats/",
      handler: "campaign.getStats",
    },
  ]
}