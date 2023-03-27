// const strapi = require('@strapi/strapi')
const yotpo = require("../../../../lib/yotpo");
const emails = require("../../../../lib/emails");

module.exports = {
  async beforeUpdate(event) {
    const { result, params } = event;
    const { data, where, select, populate } = params;

    const updated_status = data.status;

    if (!updated_status) {
      console.log("updated_status is null, dont do anything");
      return;
    }

    const order = await strapi.entityService
      .findOne("api::order.order", where.id, {
        populate: ["profile", "site"],
      })
      .catch((err) => {
        console.log(err);
        return err;
      });

    const old_status = order.status;
    if (old_status === updated_status) {
      //if status is not updated, don't do anything
      console.log("order status not updated, dont do anything");
      return;
    }

    if (updated_status != "paid") {
      //don't do anything if order hasn't been updated to paid
      return;
    }

    const profile = order.profile;

    const site = order.site;

    //create purchased publications
    let purchasedPublicationPromises = order.items.map(async (item) => {
      const publication = await strapi.entityService
        .findOne(
          "api::publication.publication",
          item.price_data.product_data.metadata.publication_id
        )
        .catch((err) => {
          console.log(err);
          return err;
        });

      //if quantity is greater than 1, create multiple purchased publications
      for (let i = 0; i < item.quantity; i++) {
        return strapi
          .service("api::purchased-publication.purchased-publication")
          .create({
            data: {
              email: order.email,
              price: item.price_data.unit_amount / 100, //convert to dollars from cents
              order: order.id,
              site: site?.id,
              profile: profile.id,
              publication: publication.id,
              ref_id: order.ref_id,
              publication_sale_price: publication.price,
              publication_internal_cost: publication.internal_cost,
            },
          });
      }
    });

    await Promise.all(purchasedPublicationPromises)
      .then((results) => {
        console.log("All purchased publications created");
      })
      .catch((err) => {
        console.log("Error creating purchased publications: ", err);
      });

    //setup product data for yotpo
    var products = {};
    order.items.forEach((item) => {
      products[item.price_data.product_data.metadata.publication_id] = {
        name: item.price_data.product_data.name,
        price: item.price_data.unit_amount,
        url: "https://www.waverlypress.com/publications",
        specs: null,
      };
    });

    // const line_items = result.items.map((item) => {
    //   return {
    //     name: item.price_data.product_data.name,
    //     price: item.price_data.unit_amount,
    //     total_price: item.price_data.unit_amount * item.quantity, //need to include tax and fee later
    //     subtotal_price: item.price_data.unit_amount * item.quantity,
    //     url: "https://www.waverlypress.com/publications",
    //     external_product_id: item.product_data.publication_id,
    //     quantiy: item.quantiy
    //   }
    // })

    const publicationNames = order.items.map((item) => {
      return item.price_data.product_data.name;
    });

    const site_domain = site.customDomain
      ? `https://${site.customDomain}`
      : `https://${site.subdomain}.pressbackend.com`;

    const sendOrderConfirmation = await emails.sendOrderConfirmation({
      email: order.email,
      publications: publicationNames,
      clientName: profile.name,
      siteName: site?.name,
      siteEmail: site?.email,
      newCampaignUrl: `${site_domain}/campaigns/new`,
    });

    if (data.credits_applied) {
      //if order has credits, create credits
      const credit = await strapi.service("api::credit.credit").create({
        data: {
          profile: profile.id,
          amount: data.credits_applied,
          type: "debit",
        },
      });
    }

    // if (process.env.NODE_ENV == "production") {
    //   // only send orders to yotpo if we're in production
    //   console.log("sending order to yotpo");
    //   const sendYotpoOrder = await yotpo.sendOrder({
    //     order: order,
    //     products,
    //     profile,
    //   });
    // }

    return sendOrderConfirmation;
  },
};
