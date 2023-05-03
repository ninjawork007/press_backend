module.exports = {
  routes: [
    {
      method: "GET",
      path: "/stats/",
      handler: "campaign.getStats",
    },
    {
      method: "GET",
      path: "/campaign-list",
      handler: "campaign.getHits",
    },
  ]
}