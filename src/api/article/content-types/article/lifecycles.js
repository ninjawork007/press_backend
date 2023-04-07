// const strapi = require('@strapi/strapi')
const emails = require("../../../../lib/emails");

module.exports = {
  async afterCreate(event) {
    const { result, params } = event;
    const { data, where, select, populate } = params;
    const is_written_by_user = data.is_written_by_user;

    const campaign = await strapi.entityService.findOne(
      "api::campaign.campaign",
      data.campaign,
      {
        populate: ["profile", "campaign", "questionnaire"],
      }
    );

    const purchasedPublication = await strapi.entityService.findOne(
      "api::purchased-publication.purchased-publication",
      data.purchased_publication,
      {
        populate: ["publication"],
      }
    );

    const clientName = campaign.profile.name;
    const publicationName = purchasedPublication.publication.name;
    const questionnaire = campaign.questionnaire;

    const articleUrl = `https://app.pressbackend.com/campaigns/${campaign.id}/articles/${article.id}`;
    console.log({ questionnaire });

    if (is_written_by_user) {
      return emails.sendArticleUploadToManagers({
        clientName,
        publicationName,
        articleUrl,
      });
    } else {
      return emails.sendArticleRequestToManagers({
        clientName,
        publicationName,
        questionnaire,
        articleUrl,
      });
    }
  },
  async beforeUpdate(event) {
    const { result, params, model } = event;
    const { data, where, select, populate } = params;
    //do something to the result
    const updated_status = data.status;
    const approvedForPublishing = data.approved_for_publishing;

    if (!updated_status) {
      console.log("updated_status is null, dont do anything");
      return;
    }

    const article = await strapi.entityService
      .findOne("api::article.article", where.id, {
        populate: [
          "campaign",
          "campaign.profile",
          "purchased_publication",
          "purchased_publication.publication",
          "purchased_publication.site",
        ],
      })
      .catch((err) => {
        console.log(err);
        return err;
      });

    const old_status = article.status;
    if (old_status === updated_status) {
      //if status is not updated, don't do anything
      console.log("article status not updated");
      return;
    }

    if (
      updated_status !== "publishing" &&
      updated_status !== "completed" &&
      updated_status !== "reviewing" &&
      updated_status !== "requires-action"
    ) {
      console.log(
        "article not reviewing, requires-action, publishing, or completed - don't need to do anything"
      );
      return;
    }
    const draftCount = data.draftCount;
    const campaign = article.campaign;
    const purchasedPublication = article.purchased_publication;
    const publication = purchasedPublication.publication;
    const site = purchasedPublication.site;

    const profile = campaign.profile;

    const articleId = article.id;
    const campaignId = campaign.id;
    const campaignName = campaign.name;

    const clientName = profile.name;
    const clientEmail = profile.email;

    const publicationName = purchasedPublication.publication.name;
    const publishedUrl = data.url;
    const site_domain = site.customDomain
      ? `https://${site.customDomain}`
      : `https://${site.subdomain}.pressbackend.com`;
    let articleUrl = `${site_domain}/campaigns/${campaignId}/articles/${articleId}`;
    const siteName = site.name;
    const siteEmail = site.email;

    if (updated_status === "publishing") {
      console.log("sending publishing notice to client");

      return emails.sendPublishingNoticeToClient({
        clientEmail,
        campaignId,
        clientName,
        publicationName,
        articleUrl,
        siteName,
        siteEmail,
      });
    } else if (updated_status === "completed") {
      console.log("sending published article to client");

      return emails.sendCompletedArticleToClient({
        clientName,
        clientEmail,
        campaignName,
        publicationName,
        articleUrl: publishedUrl,
        siteName,
        siteEmail,
      });
    } else if (updated_status === "requires-action") {
      if (draftCount === 1) {
        console.log("sending initial draft to client");

        return emails.sendArticleDraftToClient({
          clientName,
          clientEmail,
          publicationName,
          articleUrl,
          siteName,
          siteEmail,
        });
      } else {
        console.log("sending edits to client");

        return emails.sendArticleEditsToClient({
          clientName,
          clientEmail,
          publicationName,
          articleUrl,
          siteName,
          siteEmail,
        });
      }
    } else if (updated_status === "reviewing") {
      if (approvedForPublishing) {
        console.log("sending article to publisher for publishing");
        articleUrl = `https://app.pressbackend.com/campaigns/${campaignId}/articles/${article.id}`;

        return emails.sendNoticeToPublishToAscend({
          clientName,
          publicationName,
          campaignId,
        });
      } else {
        console.log("sending article to publisher for review");
        articleUrl = `https://app.pressbackend.com/campaigns/${campaignId}/articles/${article.id}`;

        return emails.sendArticleEditsToManagers({
          clientName,
          clientEmail,
          publicationName,
          articleUrl,
        });
      }
    }
  },
};
