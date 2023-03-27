// send an email to the user when a Message is 'saved' in the admin panel

module.exports = {
  async afterCreate(event) {
    // Connected to "Save" button in admin panel
    const { result, params } = event;
    const { data, where, select, populate } = params;
    try {
      const campaign = await strapi.entityService.findOne(
        "api::campaign.campaign",
        data.campaign,
        {
          populate: ["profile"],
        }
      );

      const article = await strapi.entityService.findOne(
        "api::article.article",
        data.article,
        {
          populate: ["purchased_publication", "purchased_publication.site"],
        }
      );

      const client_profile = campaign.profile;
      const is_from_client = data.is_from_client;
      const recipient_email = is_from_client
        ? process.env.ASCEND_EMAIL
        : client_profile.email;
      const site = article.purchased_publication.site;
      const siteName = site.name;
      const siteEmail = site.email;

      const site_domain =
        `https://${site.customDomain}` ||
        `https://${site.subdomain}.pressbackend.com`;
      const subject = is_from_client
        ? `New Message from ${client_profile.name}`
        : `New Message from ${siteName}`;

      const campaignUrl = is_from_client ? `https://app.pressbackend.com/campaigns/${data.campaign}` : `${site_domain}/campaigns/${data.campaign}`;

      await strapi.plugins["email"].services.email.send({
        to: `${recipient_email}`,
        from: `${siteName} <${siteEmail}>`, // e.g. single sender verification in SendGrid
        //   bcc: 'valid email address',
        subject: subject,
        // text: `To reply to this message please visit ${campaign.url}`,
        html: `<p>"${data.text}"</p><br/><p>To reply to this message please visit <a href=${campaignUrl}>${campaignUrl}</a></p>`,
      });
    } catch (err) {
      console.log("error sending message notification email", err);
    }
  },
};
