module.exports = {
  routes: [
    {
      method: "GET",
      path: "/purchased-publication-list",
      handler: "purchased-publication.getHits",
    },
  ]
}