"use strict";

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::credit.credit", ({ strapi }) => ({
  async calcTotal(ctx) {

    const profile_id = ctx.params.profile_id;
    console.log({profile_id})
    let total = await strapi.service('api::credit.credit').calcTotal(profile_id);
    ctx.send(total);
  },
}));
