// const strapi = require('@strapi/strapi')
const emails = require("../../../../lib/emails");

module.exports = {
  async afterCreate(event) {
    const { result, params, model } = event;
    const { data, where, select, populate } = params;

    const publication = await strapi.entityService.findOne(
      "api::publication.publication",
      result.id
    );
    

    const sites = await strapi.entityService.findMany(
      "api::site.site",
      {
        fields: ["id"],
      }
    );


    const markup_percentage = 1.20
    let marked_up_price = publication.price * markup_percentage;
    const marked_up_publication_price_to_nearest_tenth =
      Math.round(marked_up_price / 10) * 10;
              


    let promises = sites.map((site) => {
      return strapi.entityService.create("api::site-publication.site-publication", {
        data: {
          publication: publication.id,
          price: marked_up_publication_price_to_nearest_tenth,
          site: site.id,
          is_hidden: true,
        },
      });
    });

    return Promise.all(promises);
  },
  async beforeUpdate(event) {
    const { result, params, model } = event;
    const { data, where, select, populate } = params;

    const updated_reseller_price = data.price;

    if (!updated_reseller_price) {
      //if reseller_price is not updated, don't do anything
      console.log("reseller_price is null, dont do anything");
      return;
    }

    const publication = await strapi.entityService.findOne(
      "api::publication.publication",
      where.id
    );
    
    const old_reseller_price = publication.price;
    if (old_reseller_price === updated_reseller_price) {
      //if reseller_price is not updated, don't do anything
      console.log("reseller_price not updated");
      return;
    }

    const site_publications = await strapi.entityService.findMany(
      "api::site-publication.site-publication",
      {
        filters: { publication: { id: {$eq: publication.id} } },
        fields: ["id"],
      }
    );

    let promises = site_publications.map((site_publication) => {
      const markup_percentage = 1.20;
      let marked_up_price = updated_reseller_price * markup_percentage;

      const marked_up_publication_price_to_nearest_tenth =
        Math.round(marked_up_price / 10) * 10;

      return strapi
        .service("api::site-publication.site-publication")
        .update(site_publication.id, {
          data: {
            price: marked_up_publication_price_to_nearest_tenth,
          },
        });
    });

    return Promise.all(promises);
  },
  async beforeDelete(event) {
    const { result, params, model } = event;
    const { data, where, select, populate } = params;
    //do something to the result
    console.log("publication deleted");

    const site_publications = await strapi.entityService.findMany(
      "api::site-publication.site-publication",
      {
        filters: { publication: { id: {$eq: where.id} } },
        fields: ["id"],
      }
    );
    console.log({site_publications})

    let publications_to_delete = site_publications.map(
      (site_publication) => {
        strapi.entityService.delete(
          "api::site-publication.site-publication",
          site_publication.id
        );
      }
    );

    return Promise.all(publications_to_delete);
  }
};
