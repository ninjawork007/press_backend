"use strict";

/**
 * credit service.
 */

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService("api::credit.credit", ({ strapi }) => ({
  async calcTotal(profile_id) {
    let total = 0;
    console.log({profile_id})
    const credits = await strapi.entityService.findMany(
      "api::credit.credit",
      {
        filters: { profile: { id: {$eq: profile_id} } }
      }
    );

    credits.forEach((credit) => {
      if (credit.type === "credit") {
        total += credit.amount;
      } else {
        total -= credit.amount;
      }
    });

    return total
  },
}));
