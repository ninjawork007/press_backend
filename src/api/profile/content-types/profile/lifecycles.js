// const strapi = require('@strapi/strapi')
const emails = require("../../../../lib/emails");

module.exports = {
  async afterUpdate(event) {
    const { result, params, model } = event;
    const { data, where, select, populate } = params;
    //do something to the result
    if (result.is_whitelabel !== true) {
      return;
    }
    const profile = await strapi.entityService.findOne('api::profile.profile', result.id, {
        populate: { whitelabel_site: true },
    });
    if (profile.whitelabel_site) {
      console.log("user site already exists");
      return;
    }


    const clientName = profile.name;
    const profile_id = profile.id;

    const site_publication_categories = await strapi.entityService.findMany(
      "api::publication-category.publication-category",
      {
        fields: ["id"],
      }
    );

    const site = await strapi.service("api::site.site").create({
      data: {
        name: `${clientName}'s Site`,
        owner: profile_id,
        site_publication_categories
      },
    });

    const publications = await strapi.entityService.findMany(
      "api::publication.publication",
      {
        publicationState: 'live',
        fields: ["id", "price"],
      }
    );

    const site_publication_data = publications.map((publication) => {
        const markup_percentage = 1.20
        let marked_up_price = publication.price * markup_percentage;
        const marked_up_publication_price_to_nearest_tenth =
          Math.round(marked_up_price / 10) * 10;

      return {
        publication: publication.id,
        price: marked_up_publication_price_to_nearest_tenth,
        site: site.id,
      };
    });

    await site_publication_data.forEach((site_publication) => {
      strapi.entityService.create("api::site-publication.site-publication", {
        data: site_publication,
      });
    });
  },
};
