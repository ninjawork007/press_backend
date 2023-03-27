const crypto = require("crypto");
const { getService } = require("@strapi/plugin-users-permissions/server/utils");

const _ = require("lodash");
const utils = require("@strapi/utils");
const urlJoin = require("url-join");

const { getAbsoluteAdminUrl, getAbsoluteServerUrl, sanitize } = utils;
const { ApplicationError, ValidationError } = utils.errors;
const {
  validateSendEmailConfirmationBody,
} = require("../../../node_modules/@strapi/plugin-users-permissions/server/controllers/validation/auth");

const emailRegExp =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const sanitizeUser = (user, ctx) => {
  const { auth } = ctx.state;
  const userSchema = strapi.getModel("plugin::users-permissions.user");

  return sanitize.contentAPI.output(user, userSchema, { auth });
};

module.exports = (plugin) => {
  plugin.controllers.auth.forgotPassword = async (ctx) => {
    // Find the user by email.
    let { email } = ctx.request.body;

    // get the user by email and populate profile
    const user = await strapi
      .query("plugin::users-permissions.user")
      .findOne({ where: { email }, populate: ["profile", "profile.site"] });

    if (!user) {
      return ctx.badRequest(null, [{ messages: [{ id: "user.notFound" }] }]);
    }

    if (!user.profile.site?.email) {
      return ctx.badRequest(null, [
        { messages: [{ id: "email on site not configured" }] },
      ]);
    }
    const siteName = user.profile.site.name;
    const siteEmail = user.profile.site.email;
    console.log({email, siteEmail, siteName})
    const siteDomain =
      user.profile.site.customDomain ||
      `${user.profile.site.subdomain}.pressbackend.com`;
    const siteUrl = `https://${siteDomain}`;
    // Check if the provided email is valid or not.
    const isEmail = emailRegExp.test(email);

    if (isEmail) {
      email = email.toLowerCase();
    } else {
      throw new ValidationError("Please provide a valid email address");
    }

    const pluginStore = await strapi.store({
      type: "plugin",
      name: "users-permissions",
    });

    // User not found.
    if (!user) {
      throw new ApplicationError("This email does not exist");
    }

    // User blocked
    if (user.blocked) {
      throw new ApplicationError("This user is disabled");
    }

    // Generate random token.
    const resetPasswordToken = crypto.randomBytes(64).toString("hex");

    const settings = await pluginStore
      .get({ key: "email" })
      .then((storeEmail) => {
        try {
          return storeEmail["reset_password"].options;
        } catch (error) {
          return {};
        }
      });

    const advanced = await pluginStore.get({
      key: "advanced",
    });

    const userInfo = await sanitizeUser(user, ctx);

    settings.message = await getService("users-permissions").template(
      settings.message,
      {
        URL: `${siteUrl}/account/reset-password`,
        SERVER_URL: getAbsoluteServerUrl(strapi.config),
        ADMIN_URL: getAbsoluteAdminUrl(strapi.config),
        USER: userInfo,
        TOKEN: resetPasswordToken,
      }
    );

    settings.object = await getService("users-permissions").template(
      settings.object,
      {
        USER: userInfo,
      }
    );

    try {
      // Send an email to the user.
      await strapi
        .plugin("email")
        .service("email")
        .send({
          to: email,
          from: `${siteName} <${siteEmail}>`,
          subject: "Reset Password",
          text: settings.message,
          html: settings.message,
        });
    } catch (err) {
      throw new ApplicationError(err.message);
    }

    // Update the user.
    await strapi
      .query("plugin::users-permissions.user")
      .update({ where: { id: user.id }, data: { resetPasswordToken } });

    ctx.send({ ok: true });
  };

  plugin.controllers.auth.emailConfirmation = async (ctx, next, returnUser) => {
    const { confirmation: confirmationToken } = ctx.query;

    const userService = getService("user");
    const jwtService = getService("jwt");

    if (_.isEmpty(confirmationToken)) {
      throw new ValidationError("token.invalid");
    }

    const [user] = await userService.fetchAll({
      filters: { confirmationToken },
    });

    if (!user) {
      throw new ValidationError("token.invalid");
    }

    await userService.edit(user.id, {
      confirmed: true,
      confirmationToken: null,
    });

    const userData = await strapi
      .query("plugin::users-permissions.user")
      .findOne({
        where: { id: user.id },
        populate: ["profile", "profile.site"],
      });

    if (!userData.profile.site?.email) {
      return ctx.badRequest(null, [
        { messages: [{ id: "email on site not configured" }] },
      ]);
    }

    const siteDomain =
      userData.profile.site.customDomain ||
      `${userData.profile.site.subdomain}.pressbackend.com`;
    const siteUrl = `https://${siteDomain}/login?verified=true`;

    if (returnUser) {
      ctx.send({
        jwt: jwtService.issue({ id: user.id }),
        user: await sanitizeUser(user, ctx),
      });
    } else {
      const settings = await strapi
        .store({ type: "plugin", name: "users-permissions", key: "advanced" })
        .get();

      ctx.redirect(siteUrl || "/");
    }
  };

  const oldUserServices = plugin.services.user;
  plugin.services.user = ({ strapi }) => {
    return {
      ...oldUserServices({ strapi }),
      sendConfirmationEmail: async (user) => {
        //get email website from and replyTo

        const registeredUser = await strapi
          .query("plugin::users-permissions.user")
          .findOne({
            where: { id: user.id },
            populate: ["profile", "profile.site"],
          });

        if (!registeredUser) {
          return ctx.badRequest(null, [
            { messages: [{ id: "user.notFound" }] },
          ]);
        }

        if (!registeredUser.profile) {
          //TODO: kinda hacky, we should refactor this
          //HACK: Strapi automatically sends a confirmation email when a user is created but before we have created a profile. So we need to allow this first automated confirmation email to return without error. And then the 2nd confirmation email will be triggered by us manually after the profile is created.
          return;
        }
        if (!registeredUser.profile.site?.email) {
          return ctx.badRequest(null, [
            { messages: [{ id: "email on site not configured" }] },
          ]);
        }
        const siteName = registeredUser.profile.site.name;
        const siteEmail = registeredUser.profile.site.email;
        const siteDomain =
          registeredUser.profile.site.customDomain ||
          `${registeredUser.profile.site.subdomain}.pressbackend.com`;
        const siteUrl = `https://${siteDomain}`;
        const from = `${siteName} <${siteEmail}>`;
        const replyTo = siteEmail;

        const userPermissionService = getService("users-permissions");
        const pluginStore = await strapi.store({
          type: "plugin",
          name: "users-permissions",
        });
        const userSchema = strapi.getModel("plugin::users-permissions.user");

        const settings = await pluginStore
          .get({ key: "email" })
          .then((storeEmail) => storeEmail["email_confirmation"].options);

        // Sanitize the template's user information
        const sanitizedUserInfo =
          await sanitize.sanitizers.defaultSanitizeOutput(userSchema, user);

        const confirmationToken = crypto.randomBytes(20).toString("hex");

        await oldUserServices({ strapi }).edit(user.id, { confirmationToken });

        const apiPrefix = strapi.config.get("api.rest.prefix");

        settings.message = await userPermissionService.template(
          settings.message,
          {
            URL: urlJoin(
              getAbsoluteServerUrl(strapi.config),
              apiPrefix,
              "/auth/email-confirmation"
            ),
            SERVER_URL: getAbsoluteServerUrl(strapi.config),
            ADMIN_URL: getAbsoluteAdminUrl(strapi.config),
            USER: sanitizedUserInfo,
            CODE: confirmationToken,
          }
        );

        settings.object = await userPermissionService.template(
          settings.object,
          {
            USER: sanitizedUserInfo,
          }
        );

        // Send an email to the user.
        await strapi.plugin("email").service("email").send({
          to: user.email,
          from: from,
          replyTo: replyTo,
          subject: settings.object,
          text: settings.message,
          html: settings.message,
        });
      },
    };
  };

  return plugin;
};
