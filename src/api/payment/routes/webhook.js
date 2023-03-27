module.exports = {
    routes: [
      {
        method: "POST",
        path: "/stripe-webhook",
        handler: "payment.webhook",
      },
    ],
  };
  