"use strict";

/**
 *  purchased-publication controller
 */

const algoliasearch = require('algoliasearch');

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
    getHits: async (ctx) => {
      try {
        const client = algoliasearch(process.env.ALGOLIA_APPLICATION_ID, process.env.ALGOLIA_ADMIN_API_KEY);
        const index = client.initIndex('dev_publications');
        const { pagination, searchQuery, filters } = ctx.request.query
        console.log('filters >>>', filters)
        let facet = ''
        if (filters?.status["NOT"]) {
          facet = `NOT status:${filters.status["NOT"]}`
        }
        if (filters?.profile?.id) {
          facet = `${facet} AND profile.id=${filters?.profile?.id}`
        }
        if (filters?.ref_id) {
          facet = `${facet} AND ref_id=${filters?.ref_id}`
        }
        if (filters?.site?.id) {
          facet = `${facet} AND site.id=${filters?.site?.id}`
        }
        if (filters?.article?.status) {
          facet = `${facet} AND article.status:${filters?.article?.status}`
        }
        if (filters?.article?.id) {
          facet = `${facet} AND has_no_artcile:true`
        }
        const res = await index.search(searchQuery, {
          page: pagination?.page,
          hitsPerPage: pagination?.pageSize,
          filters: facet
        })
        let attributes = []
        res?.hits?.map(item => {
          attributes.push({ attributes: { ...item, article: { data: { attributes: item.article } }, publication: { data: { attributes: item.publication } }, order: { data: { attributes: item.order } }, profile: { data: { attributes: item.profile } }, site: { data: { attributes: item.site } }, images: { data: item.images } } })
        })
        return {
          data: attributes,
          meta: {
            pagination: {
              page: res?.page ?? 0,
              pageCount: res?.nbPages ?? 0,
              pageSize: res?.hitsPerPage ?? 0,
              total: res?.nbHits ?? 0
            }
          }
        }
      } catch (error) {
        console.log(error)
        return { data: [] }
      }
    }
  })
);
