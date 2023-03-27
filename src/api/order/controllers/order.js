"use strict";

const coupon = require("../../payment/routes/coupon");

/**
 *  order controller
 */

const { createCoreController } = require("@strapi/strapi").factories;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = createCoreController("api::order.order", ({ strapi }) => ({
  // Method 2: Wrapping a core action (leaves core logic in place)
  async create(ctx) {
    const { items, coupon, site, profile_id } = ctx.request.body.data;
    let profile;
    let subtotal = 0;
    let total = 0;

    let processing_fee = 0;
    if (profile_id) {
      profile = await strapi.entityService.findOne(
        "api::profile.profile",
        profile_id,
        {
          populate: ["referral_received"],
        }
      );
    } else {
      const user = await strapi.entityService.findOne(
        "plugin::users-permissions.user",
        ctx.state.user.id,
        {
          populate: ["profile", "profile.referral_received"],
        }
      );
      profile = user.profile;
    }

    let redirect_url;
    let site_name = "";
    let site_url = "";

    if (site) {
      const site_id = site; //for clarification

      const siteData = await strapi.entityService.findOne(
        "api::site.site",
        site_id
      );
      site_name = siteData.name;
      site_url = siteData.customDomain;
      redirect_url = siteData.customDomain
        ? `https://${siteData.customDomain}`
        : `https://${siteData.subdomain}.pressbackend.com`;
    } else {
      //handle for existing waverlypress.com site before migration
      redirect_url = `https://waverlypress.com`;
    }

    // const discounts = [];
    // if (coupon) {
    //   discounts.push({ coupon: coupon.id });
    // }

    subtotal = items.reduce((acc, item) => {
      return acc + item.price * item.quantity;
    }, 0);
    total = subtotal;

    const line_items = items.map((item) => {
      const price_data = {
        currency: "usd",
        unit_amount: item.price * 100, // Stripe expects prices in cents
        product_data: {
          name: item.name,
          description: item.description,
          metadata: {
            publication_id: item.id,
          },
        },
      };
      return { price_data, quantity: item.quantity };
    });

    let creditTotal = await strapi
      .service("api::credit.credit")
      .calcTotal(profile.id);

    // if (!site) {
    //   //STRIPE CHECKOUT PAGE
    //   //handle for existing waverlypress.com site before migration
    //   const session = await stripe.checkout.sessions.create({
    //     metadata: {
    //       order_id: data.id,
    //       profile_id: profile.id,
    //     },
    //     line_items,
    //     discounts,
    //     mode: "payment",
    //     success_url: `${redirect_url}/campaigns/new`,
    //     cancel_url: `${redirect_url}/publications`,
    //   });

    //   return { data, session };
    // }


    // Calling the default core action
    const referral = profile.referral_received;
    let stripe_customer_id = profile.stripe_customer_id;
    if (!stripe_customer_id) {
      //create stripe customer if none exists
      const customer = await stripe.customers
        .create({
          description: `${profile.name}`,
          email: profile.email,
          name: profile.name,
          metadata: {
            profile_id: profile.id,
            site_id: site,
            site_name: site_name,
          },
        })
        .catch((err) => {
          console.log("error creating stripe customer", err);
        });

      stripe_customer_id = customer.id;
      await strapi
        .service("api::profile.profile")
        .update(profile.id, { data: { stripe_customer_id: customer.id } });
    }

    ctx.request.body.data.items = line_items;
    ctx.request.body.data.profile = profile.id;
    ctx.request.body.data.email = profile.email;
    ctx.request.body.data.subtotal = subtotal;

    if (referral) {
      ctx.request.body.data.ref_id = referral.ref_id;
    }
    if (coupon) {
      const couponData = await stripe.coupons.retrieve(coupon.id);

      if (couponData.amount_off) {
        total = subtotal - couponData.amount_off / 100;
      } else if (couponData.percent_off) {
        total = subtotal - subtotal * (couponData.percent_off / 100);
      }

      ctx.request.body.data.coupon = coupon.id;

    }

    if (creditTotal >= total) {
      //use credits for entire order

      ctx.request.body.data.total = 0;

      const { data, meta } = await super.create(ctx);

  
      let order = await strapi.service("api::order.order").update(data.id, {
        data: {
          status: "paid",
          date_paid: new Date(),
          credits_applied: total,
        },
      });
      return { order };
    } else {
      if (creditTotal > 0) {
        total = total - creditTotal;

      }
      
      processing_fee = total * 0.03;
      total = total + processing_fee;

      ctx.request.body.data.processing_fee = processing_fee;
      ctx.request.body.data.total = total;

      const { data, meta } = await super.create(ctx);

      line_items.push({
        price_data: {
          currency: "usd",
          unit_amount: Math.round(processing_fee * 100),
          product_data: {
            name: "Processing Fee",
            description: "3%",
            metadata: { publication_id: "processing_fee" },
          },
        },
        quantity: 1,
      });

      const roundedTotalInCents = Math.round(total * 100);


      //Custom STRIPE Checkout flow
      let statement_descriptor = `${site_name}`;
      if (statement_descriptor.length > 22) {
        statement_descriptor = statement_descriptor.substring(0, 22); //max 22 characters
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: roundedTotalInCents, // Stripe expects prices in cents
        currency: "usd",
        statement_descriptor: statement_descriptor,
        customer: stripe_customer_id,
        metadata: {
          order_id: data.id,
          profile_id: profile.id,
          site_id: site,
          site_name: site_name,
          coupon: coupon ? coupon.id : null,
          credits_applied: creditTotal,
        },
        //TODO: create different payment intents based off ACH or Credit Card
        payment_method_types: ["card"],
        // automatic_payment_methods: {
        //   enabled: true,
        // },
      });

      let order = await strapi.service("api::order.order").update(data.id, {
        data: {
          client_secret: paymentIntent.client_secret,
          credits_applied: creditTotal,
        },
      });

      return order;
    }
  },

  setupSubscriptionCheckout: async (ctx) => {
    const { price_id, profile_id } = ctx.request.body.data;
    let profile;
    console.log({ price_id, profile_id });
    if (profile_id) {
      profile = await strapi.entityService.findOne(
        "api::profile.profile",
        profile_id,
        {
          populate: ["referral_received"],
        }
      );
    } else {
      const user = await strapi.entityService.findOne(
        "plugin::users-permissions.user",
        ctx.state.user.id,
        {
          populate: ["profile", "profile.referral_received"],
        }
      );
      profile = user.profile;
    }

    let stripe_customer_id = profile.stripe_customer_id;

    if (!stripe_customer_id) {
      //create stripe customer if none exists
      const customer = await stripe.customers
        .create({
          description: `${profile.name}`,
          email: profile.email,
          name: profile.name,
          metadata: {
            profile_id: profile.id,
            site_id: site,
            site_name: site_name,
          },
        })
        .catch((err) => {
          console.log("error creating stripe customer", err);
        });

      stripe_customer_id = customer.id;
      await strapi
        .service("api::profile.profile")
        .update(profile.id, { data: { stripe_customer_id: customer.id } });
    }
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: price_id,
          // For metered billing, do not pass quantity
          quantity: 1,
        },
      ],
      customer: stripe_customer_id,
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          profile_id: profile.id,
        },
      },
      metadata: {
        profile_id: profile.id,
      },
      // {CHECKOUT_SESSION_ID} is a string literal; do not change it!
      // the actual Session ID is returned in the query parameter when your customer
      // is redirected to the success page.
      success_url:
        "https://presscart.com/confirmation?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://presscart.com/plans",
    });

    return session;
  },
  createSubscription: async (ctx) => {
    const { price_id, profile_id, coupon } = ctx.request.body.data;
    let profile;

    if (profile_id) {
      profile = await strapi.entityService.findOne(
        "api::profile.profile",
        profile_id,
        {
          populate: ["referral_received"],
        }
      );
    } else {
      const user = await strapi.entityService.findOne(
        "plugin::users-permissions.user",
        ctx.state.user.id,
        {
          populate: ["profile", "profile.referral_received"],
        }
      );
      profile = user.profile;
    }
    let stripe_customer_id = profile.stripe_customer_id;

    const trialEnd = moment().add(14, "days").unix();
    const subscription = await stripe.subscriptions.create({
      customer: stripe_customer_id,
      items: [{ plan: price_id }],
      trial_end: trialEnd,
      coupon,
    });

    await strapi.service("api::profile.profile").update(profile.id, {
      data: { stripe_subscription_id: subscription.id },
    });
  },
}));
