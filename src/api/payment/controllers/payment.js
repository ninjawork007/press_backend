"use strict";

/**
 *  payment controller
 */

const { createCoreController } = require("@strapi/strapi").factories;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const ejs = require("ejs");
const fs = require("fs");
const path = require("path");

const fulfillOrder = async (session) => {
  // Fulfill the purchase...
  const metadata = session.metadata;

  const order_id = metadata.order_id;

  let order = await strapi.service("api::order.order").update(order_id, {
    data: {
      status: "paid",
      date_paid: new Date(),
    },
  });
};

module.exports = createCoreController("api::payment.payment", ({ strapi }) => ({
  async webhook(ctx) {
    const unparsed = require("koa-body/unparsed.js");
    const payload = ctx.request.body[unparsed];

    const sig = ctx.request.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
    } catch (err) {
      console.log(err);
      ctx.status = 400;
    }

    switch (event.type) {
      case "checkout.session.completed":
        // Payment is successful and the subscription is created.
        // You should provision the subscription and save the customer ID to your database.
        console.log("checkout.session.completed");
        console.log(event.data.object);
        break;
      case "invoice.paid":
        const session = event.data.object;
        // Continue to provision the subscription as payments continue to be made.
        // Store the status in your database and check when a user accesses your service.
        // This approach helps you avoid hitting rate limits.
        console.log("invoice.paid");
        console.log(event.data.object);
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription
          );

          const profile_id = subscription.metadata.profile_id;

          await strapi.service("api::profile.profile").update(profile_id, {
            data: { stripe_subscription_id: subscription.id },
          });
        }
        break;
      case "invoice.payment_failed":
        // The payment failed or the customer does not have a valid payment method.
        // The subscription becomes past_due. Notify your customer and send them to the
        // customer portal to update their payment information.
        console.log("invoice.payment_failed");
        console.log(event.data.object);
        break;
      case "payment_intent.succeeded": {
        const session = event.data.object;
        // Save an order in your database, marked as 'awaiting payment'
        //   createOrder(session);

        // Check if the order is paid (for example, from a card payment)
        //
        // A delayed notification payment will have an `unpaid` status, as
        // you're still waiting for funds to be transferred from the customer's
        // account.
        if (session.status === "succeeded") {
          fulfillOrder(session);
        }

        break;
      }

      // case "checkout.session.async_payment_succeeded": {
      //   const session = event.data.object;

      //   // Fulfill the purchase...
      //   fulfillOrder(session);

      //   break;
      // }

      case "payment_method.failed": {
        const session = event.data.object;

        // Send an email to the customer asking them to retry their order
        // emailCustomerAboutFailedPayment(session);

        break;
      }
    }

    ctx.status = 200;
  },

  async getCoupon(ctx) {
    const { id } = ctx.params;
    const coupon = await stripe.coupons.retrieve(id);
    ctx.send(coupon);
  },
}));
