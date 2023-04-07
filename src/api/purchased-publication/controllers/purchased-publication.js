"use strict";

/**
 *  purchased-publication controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
  "api::purchased-publication.purchased-publication",
  ({ strapi }) => ({
    getReports: async (ctx) => {
      const { site, start_date, end_date, status, profile } = ctx.request.query;
      let query = {};

      if (status == "completed") {
        query = {
          status: {
            $ne: "canceled",
          },
          article: {
            $and: [
              {
                status: "completed",
              },
              {
                status: {
                  $ne: "rejected",
                },
              },
            ],
            publish_date: {
              $gte: start_date,
              $lte: end_date,
            },
          },
        };
      } else if (status == "purchased") {
        query = {
          status: {
            $ne: "canceled",
          },
          article: {
            $and: [
              {
                status: {
                  $ne: "canceled",
                },
              },
            ],
          },
          createdAt: {
            $gte: start_date,
            $lte: end_date,
          },
        };
      } else {
        query = {
          status: {
            $ne: "canceled",
          },
          article: {
            $and: [
              {
                status: {
                  $ne: "completed",
                },
              },
              {
                status: {
                  $ne: "canceled",
                },
              },
            ],
          },
          createdAt: {
            $gte: start_date,
            $lte: end_date,
          },
        };
      }

      if (profile) {
        query.profile = profile;
      }

      if (site) {
        query.site = site;
      }

      const purchasedPublications = await strapi.entityService.findMany(
        "api::purchased-publication.purchased-publication",
        {
          filters: query,
          sort: "createdAt:desc",
          populate: ["profile", "site", "publication", "article"],
        }
      );

      // const reports = purchasedPublications.map((purchasedPublication) => {
      //     return {
      //         id: purchasedPublication.id,
      //         date_created: purchasedPublication.date_created,
      //         email: purchasedPublication.email,
      //         price: purchasedPublication.price,
      //         order: purchasedPublication.order,
      //         site: purchasedPublication.site,
      //         profile: purchasedPublication.profile,
      //         publication: purchasedPublication.publication,
      //         ref_id: purchasedPublication.ref_id,
      //     };
      // }
      // );

      const totals = purchasedPublications.reduce(
        (acc, purchasedPublication) => {
          acc.total += purchasedPublication.price;
          acc.reseller_cost +=
            purchasedPublication.price - purchasedPublication.publication.price;
          acc.internal_cost += purchasedPublication.publication.internal_cost;
          // calculate purchasedPublications we've already paid for 
          if (purchasedPublication.is_publisher_paid) {
            acc.publisher_paid += purchasedPublication.publication.internal_cost;
          }
          if (purchasedPublication.is_reseller_paid) {
            acc.reseller_paid += (purchasedPublication.price - purchasedPublication.publication.price);
          }
          acc.count += 1;
          return acc;
        },
        { total: 0, count: 0, internal_cost: 0, reseller_cost: 0, publisher_paid: 0, reseller_paid: 0 }
      );

      return { purchasedPublications, totals };
    },
  })
);
