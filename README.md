## Waverly Backend

This application has been created using [Strapi CMS](https://strapi.io/). To get the build running locally the following steps need to be followed.

- clone the repo to you development machine
- open a Terminal session and navigate to the **root** folder
- run **npm install**
- create a .env file in the root directory and copy in the entries provided. The following can be used:

---
APP_KEYS=["key1","key2"]
API_TOKEN_SALT="salt"
ADMIN_JWT_SECRET="secret"
JWT_SECRET="secret"
---

- now run **npm run develop** in the root directory and, assuming all goes well, the application will be available on http://localhost:1337
- the application should automatically open the admin registration page, in your default browser, and this is where you will register your local admin user

If you haven't, already you will need to setup and run the Next.JS frontend and NGROK.

## Applying the baseline settings and permissions using the config-sync plugin
- login to the backend admin
- select Settings from the left hand menu
- now select Config Sync -> Interface
- click on Import, assuming this is the first time you have run the local build
- the sync will now run and all of the baseline settings will have been applied

*Note: this will only work if the config/sync is populated*
