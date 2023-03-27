const sender_email = process.env.SENDER_EMAIL;
const ascend_email = process.env.ASCEND_EMAIL;

async function sendOrderConfirmation({
  email,
  publications,
  clientName,
  siteName,
  siteEmail,
  newCampaignUrl,
}) {
  try {
    return await strapi
      .plugin("email-designer")
      .service("email")
      .sendTemplatedEmail(
        {
          to: email,
          from: siteEmail,
        },
        {
          // required - Ref ID defined in the template designer (won't change on import)
          templateReferenceId: 1,
        },
        {
          publications,
          clientName,
          siteName,
          siteEmail,
          newCampaignUrl,
        }
      );
  } catch (err) {
    console.log(err);
    strapi.log.debug("📺: ", err);
    return null;
  }
}

async function sendCampaignToAscend({
  clientName,
  campaignName,
  articleCount,
  articles,
  publicationNames,
  questionnaire,
  campaignLink,
}) {
  try {
    return await strapi
      .plugin("email-designer")
      .service("email")
      .sendTemplatedEmail(
        {
          // required
          to: ascend_email,

          // optional if /config/plugins.js -> email.settings.defaultFrom is set
          from: sender_email,

          // optional if /config/plugins.js -> email.settings.defaultReplyTo is set
          //   replyTo: 'reply@example.com',

          // optional array of files

          //   attachments: [{filename: questionnaire.name, path: questionnaire.url, content: questionnaire.url}],
        },
        {
          // required - Ref ID defined in the template designer (won't change on import)
          templateReferenceId: 3,

          // If provided here will override the template's subject.
          // Can include variables like `Thank you for your order {{= USER.firstName }}!`
          // subject: `New Campaign`,
        },
        {
          // this object must include all variables you're using in your email template
          clientName,
          campaignName,
          articleCount,
          articles,
          publications: publicationNames,
          questionnaire: questionnaire ? questionnaire.url : "",
          campaignLink,
        }
      );
  } catch (err) {
    strapi.log.debug("📺: ", err);
    return null;
  }
}

async function sendEditsToAscend({
  clientEmail,
  clientName,
  articles,
  campaignName,
  campaignLink,
}) {
  try {
    return await strapi
      .plugin("email-designer")
      .service("email")
      .sendTemplatedEmail(
        {
          // required
          to: ascend_email,

          // optional if /config/plugins.js -> email.settings.defaultFrom is set
          from: sender_email,

          // optional if /config/plugins.js -> email.settings.defaultReplyTo is set
          //   replyTo: 'reply@example.com',

          // optional array of files

          //   attachments: [{filename: questionnaire.name, path: questionnaire.url, content: questionnaire.url}],
        },
        {
          // required - Ref ID defined in the template designer (won't change on import)
          templateReferenceId: 5,
          subject: `${clientName} has provided feedback for their drafts`,
        },
        {
          // this object must include all variables you're using in your email template
          clientName,
          articles,
          campaignName,
          campaignLink,
        }
      );
  } catch (err) {
    strapi.log.debug("📺: ", err);
    return null;
  }
}

async function sendEditsToClient({ clientEmail, articles, campaignLink }) {
  try {
    return await strapi
      .plugin("email-designer")
      .service("email")
      .sendTemplatedEmail(
        {
          // required
          to: clientEmail,

          // optional if /config/plugins.js -> email.settings.defaultFrom is set
          from: sender_email,

          // optional if /config/plugins.js -> email.settings.defaultReplyTo is set
          //   replyTo: 'reply@example.com',

          // optional array of files

          //   attachments: [{filename: questionnaire.name, path: questionnaire.url, content: questionnaire.url}],
        },
        {
          // required - Ref ID defined in the template designer (won't change on import)
          templateReferenceId: 4,

          // If provided here will override the template's subject.
          // Can include variables like `Thank you for your order {{= USER.firstName }}!`
          // subject: `New Campaign`,
        },
        {
          // this object must include all variables you're using in your email template
          articles,
          campaignLink,
        }
      );
  } catch (err) {
    strapi.log.debug("📺: ", err);
    return null;
  }
}

async function sendArticleDraftToClient({
  clientName,
  clientEmail,
  articleUrl,
  siteName,
  siteEmail,
  publicationName
}) {
  try {
    return await strapi
      .plugin("email-designer")
      .service("email")
      .sendTemplatedEmail(
        {
          // required
          to: clientEmail,

          // optional if /config/plugins.js -> email.settings.defaultFrom is set
          from: `${siteName} <${siteEmail}>`,

          // optional if /config/plugins.js -> email.settings.defaultReplyTo is set
          //   replyTo: 'reply@example.com',

          // optional array of files

          //   attachments: [{filename: questionnaire.name, path: questionnaire.url, content: questionnaire.url}],
        },
        {
          // required - Ref ID defined in the template designer (won't change on import)
          templateReferenceId: 12,

          // If provided here will override the template's subject.
          // Can include variables like `Thank you for your order {{= USER.firstName }}!`
          subject: `Your draft for ${publicationName} is ready for review`,
        },
        {
          // this object must include all variables you're using in your email template
          clientName,
          articleUrl,
          publicationName,
          siteName,
          siteEmail,
        }
      );
  } catch (err) {
    strapi.log.debug("📺: ", err);
    return null;
  }
}

async function sendArticleEditsToClient({
  clientName,
  clientEmail,
  articleUrl,
  siteName,
  siteEmail,
  publicationName
}) {
  try {
    return await strapi
      .plugin("email-designer")
      .service("email")
      .sendTemplatedEmail(
        {
          // required
          to: clientEmail,

          // optional if /config/plugins.js -> email.settings.defaultFrom is set
          from: `${siteName} <${siteEmail}>`,

          // optional if /config/plugins.js -> email.settings.defaultReplyTo is set
          //   replyTo: 'reply@example.com',

          // optional array of files

          //   attachments: [{filename: questionnaire.name, path: questionnaire.url, content: questionnaire.url}],
        },
        {
          // required - Ref ID defined in the template designer (won't change on import)
          templateReferenceId: 11,

          // If provided here will override the template's subject.
          // Can include variables like `Thank you for your order {{= USER.firstName }}!`
          subject: `Your requested edits for ${publicationName} are ready for review`,
        },
        {
          // this object must include all variables you're using in your email template
          clientName,
          articleUrl,
          publicationName,
          siteName,
          siteEmail,
        }
      );
  } catch (err) {
    strapi.log.debug("📺: ", err);
    return null;
  }
}

async function sendArticleEditsToManagers({
  clientName,
  clientEmail,
  articleUrl,
  publicationName
}) {
  try {
    return await strapi
      .plugin("email-designer")
      .service("email")
      .sendTemplatedEmail(
        {
          to: ascend_email,
          from: sender_email,
        },
        {
          // required - Ref ID defined in the template designer (won't change on import)
          templateReferenceId: 13,

          // If provided here will override the template's subject.
          // Can include variables like `Thank you for your order {{= USER.firstName }}!`
          subject: `${clientName} has requested edits for their ${publicationName} draft`,
        },
        {
          // this object must include all variables you're using in your email template
          clientName,
          articleUrl,
          publicationName
        }
      );
  } catch (err) {
    strapi.log.debug("📺: ", err);
    return null;
  }
}

async function sendArticleRequestToManagers({
  clientEmail,
  clientName,
  publicationName,
  articleUrl,
  questionnaire,
}) {
  try {
    return await strapi
      .plugin("email-designer")
      .service("email")
      .sendTemplatedEmail(
        {
          to: ascend_email,
          from: sender_email,
        },
        {
          subject: `${clientName} has requested a ${publicationName} article`,

          templateReferenceId: 9,
        },
        {
          clientName,
          articleUrl,
          publicationName,
          questionnaire,
        }
      );
  } catch (err) {
    strapi.log.debug("📺: ", err);
    return null;
  }
}

async function sendArticleUploadToManagers({
  clientName,
  publicationName,
  articleUrl,
}) {
  try {
    return await strapi
      .plugin("email-designer")
      .service("email")
      .sendTemplatedEmail(
        {
          to: ascend_email,
          from: sender_email,
        },
        {
          templateReferenceId: 10,
          subject: `${clientName} uploaded an article for ${publicationName}`,
        },
        {
          clientName,
          articleUrl,
          publicationName,
        }
      );
  } catch (err) {
    strapi.log.debug("📺: ", err);
    return null;
  }
}

async function sendNoticeToPublishToAscend({
  clientName,
  publicationName,
  campaignId,
}) {
  try {
    return await strapi
      .plugin("email-designer")
      .service("email")
      .sendTemplatedEmail(
        {
          to: ascend_email,
          from: sender_email,
        },
        {
          subject: `${clientName} has approved their ${publicationName} article for publishing`,
          templateReferenceId: 6,
        },
        {
          clientName,
          campaignId,
          publicationName,
        }
      );
  } catch (err) {
    strapi.log.debug("📺: ", err);
    return null;
  }
}

async function sendPublishingNoticeToClient({
  clientEmail,
  clientName,
  publicationName,
  articleUrl,
  siteName,
  siteEmail,
}) {
  try {
    return await strapi
      .plugin("email-designer")
      .service("email")
      .sendTemplatedEmail(
        {
          to: clientEmail,
          from: siteEmail,
        },
        {
          subject: `Your ${publicationName} article is scheduled for publishing!`,
          templateReferenceId: 8,
        },
        {
          clientName,
          articleUrl,
          siteName,
          publicationName,
          siteEmail,
        }
      );
  } catch (err) {
    strapi.log.debug("📺: ", err);
    return null;
  }
}

async function sendCompletedArticleToClient({
  clientEmail,
  clientName,
  publicationName,
  campaignName,
  articleUrl,
  siteName,
  siteEmail,
}) {
  try {
    return await strapi
      .plugin("email-designer")
      .service("email")
      .sendTemplatedEmail(
        {
          to: clientEmail,
          from: siteEmail,
        },
        {
          subject: `Your ${publicationName} article has been published!`,
          templateReferenceId: 7,
        },
        {
          clientName,
          campaignName,
          publicationName,
          articleUrl,
          siteName,
          siteEmail,
        }
      );
  } catch (err) {
    strapi.log.debug("📺: ", err);
    return null;
  }
}

module.exports = {
  sendOrderConfirmation,
  sendCampaignToAscend,
  sendEditsToClient,
  sendEditsToAscend,
  sendNoticeToPublishToAscend,
  sendCompletedArticleToClient,
  sendPublishingNoticeToClient,
  sendArticleRequestToManagers,
  sendArticleUploadToManagers,
  sendArticleEditsToClient,
  sendArticleDraftToClient,
  sendArticleEditsToManagers
};
