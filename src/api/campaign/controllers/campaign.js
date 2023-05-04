'use strict';

/**
 *  campaign controller
 */

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
  }
}));
