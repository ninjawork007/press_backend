'use strict';

/**
 *  campaign controller
 */
const algoliasearch = require('algoliasearch');


const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::campaign.campaign', ({ strapi }) => ({
  getStats: async (ctx) => {
    try {
      const campaignData = await strapi.db.query('api::campaign.campaign').findMany();

      let pending_count = 0;
      let reviewing_count = 0
      let requires_action_count = 0
      let completed_count = 0
      let publishing_count = 0
      let drafting_count = 0

      campaignData.map(item => {
        if (!item.status) {
          drafting_count += 1
        }
        if (item.status === 'pending') {
          pending_count += 1
        }
        if (item.status === 'requires-action') {
          requires_action_count += 1
        }
        if (item.status === 'reviewing') {
          reviewing_count += 1
        }
        if (item.status === 'completed') {
          completed_count += 1
        }
        if (item.status === 'publishing') {
          publishing_count += 1
        }
      })
      return {
        pending_count,
        reviewing_count,
        requires_action_count,
        completed_count,
        publishing_count,
        drafting_count
      }
    } catch (error) {
      return { error: 'Some error occurred, please try again!' }
    }
  },
  getHits: async (ctx) => {
    try {
      const client = algoliasearch(process.env.ALGOLIA_APPLICATION_ID, process.env.ALGOLIA_ADMIN_API_KEY);
      const index = client.initIndex('test_campaign');
      const { pagination, search } = ctx.request.query
      const res = await index.search(search, {
        page: pagination.page,
        hitsPerPage: pagination.pageSize
      })
      let attributes = []
      res?.hits?.map(item => {
        let articleAttributes = []
        item?.articles?.map(article => articleAttributes.push({ attributes: article }))
        attributes.push({ attributes: { ...item, articles: { data: articleAttributes }, profile: { data: { attributes: item.profile } }, questionnaire: { data: item.questionnaire }, images: { data: item.images } } })
      })
      return {
        data: attributes,
        meta: {
          pagination: {
            page: res.page,
            pageCount: res.nbPages,
            pageSize: res.hitsPerPage,
            total: res.nbHits
          }
        }
      }
    } catch (error) {
      console.log(error)
      return { data: [] }
    }
  }
}));
