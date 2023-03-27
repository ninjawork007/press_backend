// send an email to the user when a Message is 'saved' in the admin panel
const ascend_email = process.env.ASCEND_EMAIL;

module.exports = {
  async afterCreate(event) {
    // Connected to "Save" button in admin panel
    const { result, params } = event;
    const { data } = params;
    try {
      const purchased_inquiry = await strapi.entityService.findOne(
        "api::publication-inquiry.publication-inquiry",
        result.id,
        {
          populate: ["publication", "site"],
        }
      );

      const site = purchased_inquiry.site;
      const siteName = site.name;
      const siteEmail = site.email;
      const publication = purchased_inquiry.publication;
      const publicationName = publication?.name;
      const email = purchased_inquiry.email;
      const name = purchased_inquiry.name;
      const phone = purchased_inquiry.phone_number;
      const notes = purchased_inquiry.notes;

      await strapi.plugins["email"].services.email.send({
        to: ascend_email,
        from: `${siteName} <${siteEmail}>`, // e.g. single sender verification in SendGrid
        subject: `New inquiry from ${name} on ${siteName}`,
        html: `
        <p>Hi Support Team,</p>
        <p>You have a new inquiry from ${name}.</p>
        <p>Here are the details:</p>
        <ul>
          <li>Name: ${name}</li>
          <li>Email: ${email}</li>
          <li>Phone: ${phone}</li>
          <li>Site: ${siteName}</li>
          <li>Publication: ${publicationName}</li>
          <li>Notes: ${notes}</li>
          
        </ul>
        <p>Thank you!</p>
        `,
      });
    } catch (err) {
      console.log("error sending message notification email", err);
    }
  },
};
