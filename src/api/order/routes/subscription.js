module.exports = {
    routes: [
      {
        method: "POST",
        path: "/subscriptions/checkout",
        handler: "order.setupSubscriptionCheckout",
      },
    ],
  };
  