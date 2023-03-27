// send an email to the user when a Message is 'saved' in the admin panel
const ascend_email = process.env.ASCEND_EMAIL;
const sender_email = process.env.SENDER_EMAIL;

module.exports = {
  async afterCreate(event) {
    // Connected to "Save" button in admin panel
    const { result, params } = event;
    const { data } = params;
    try {
      const lead = result

      const email = lead.email;
      const name = lead.name;
      const phone = lead.phone;
      const jobTitle = lead.job_title;

      await strapi.plugins["email"].services.email.send({
        to: ascend_email,
        from: sender_email, // e.g. single sender verification in SendGrid
        subject: `New lead: ${name}`,
        html: `
        <p>Hi Support Team,</p>
        <p>You have a new lead: ${name}.</p>
        <p>Here are the details:</p>
        <ul>
          <li>Name: ${name}</li>
          <li>Email: ${email}</li>
          <li>Phone: ${phone}</li>
          <li>Job Title: ${jobTitle}</li>
          
        </ul>
        <p>Thank you!</p>
        `,
      });
    } catch (err) {
      console.log("error sending message notification email", err);
    }
  },
};
