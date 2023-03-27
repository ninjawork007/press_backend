// // const strapi = require('@strapi/strapi')
// const emails = require('../../../../lib/emails')

// module.exports = {
//     async afterCreate(event) {
//         const { result, params } = event
//         const { data, where, select, populate } = params
//         //do something to the result
//         if (result.status !== "reviewing") { return }
//         const questionnaire = await strapi.entityService.findOne('plugin::upload.file', data.questionnaire, {
//             // populate: { profile: true },
//         });

//         const profile = await strapi.entityService.findOne('api::profile.profile', data.profile, {
//           // populate: { profile: true },
//       });

//       const clientName = profile.name
//         const campaignName = data.name

//         const articleIds = data.articles

//         const articleCount = articleIds.length

//         const articleFetches = articleIds.map((articleId) => {
//           return strapi.entityService.findOne('api::article.article', articleId, {
//             populate: ['purchased_publication', 'purchased_publication.publication', 'publication', 'drafts']
//           });
//         })

//         const articles = await Promise.all(articleFetches).then((results) => {
//           return results
//         }).catch((err) => {
//           console.log(err)
//           return err
//         })

//         const publicationNames = articles.map((article) => {
//           return article.purchased_publication?.publication?.name
//         })

//         // const publicationIds = articles.map((article) => article.publication)
//         // //need to fetch publications
//         // const publicationFetches = publicationIds.map((publicationId) => {
//         //   return strapi.entityService.findOne('api::publication.publication', publicationId, {

//         //   });
//         // })

//         // const publications = await Promise.all(publicationFetches).then((results) => {
//         //   return results
//         // }).catch((err) => {
//         //   console.log(err)
//         //   return err
//         // })

//         return emails.sendCampaignToAscend({clientName, campaignName, articleCount, articles, publicationNames, questionnaire})
//     },
//     async afterUpdate(event) {
//       const { result, params, model } = event
//       const { data, where, select, populate } = params
//       //do something to the result
//       const campaign = await strapi.entityService.findOne('api::campaign.campaign', result.id, {
//         populate:  ['profile', 'articles', 'articles.purchased_publication',  'articles.purchased_publication.publication', 'articles.drafts' , 'questionnaire'],
//       }).catch((err) => {
//         console.log(err)
//         return err
//       });;

//       // var questionnaire

//       // if (campaign.questionnaire) {
//       //   questionnaire = await strapi.entityService.findOne('plugin::upload.file', data.questionnaire, {
//       //     // populate: { profile: true },
//       //   }).catch((err) => {
//       //     console.log(err)
//       //     return err
//       // });;
//       // }

//   //     const profile = await strapi.entityService.findOne('api::profile.profile', data.profile, {
//   //       // populate: { profile: true },
//   //   }).catch((err) => {
//   //     console.log(err)
//   //     return err
//   // });;
//       const profile = campaign.profile
//       const questionnaire = campaign.questionnaire

//       const clientName = profile.name

//       const clientEmail = profile.email
//       const campaignName = campaign.name
//       const campaignLink = `${process.env.APPLICATION_URL}/campaigns/${campaign.id}`

//       const articles = campaign.articles

//       if (!articles) { 
//         console.log("No articles")
//         return 
//       }

//       const articleCount = articles.length

//       // const articleFetches = articleIds.map((articleId) => {
//       //   return strapi.entityService.findOne('api::article.article', articleId, {
//       //     populate: { publication: true, drafts: true }
//       //   }).catch((err) => {
//       //       console.log(err)
//       //       return err
//       //   });
//       // })

//       // const articles = await Promise.all(articleFetches).then((results) => {
//       //   return results
//       // }).catch((err) => {
//       //   console.log(err)
//       //   return err
//       // })

//       // console.log(articles)

//     if (result.reviewCount == 0) {
//       console.log("sending new campaign to ASCEND")
//         const publicationNames = articles.map((article) => {
//           // console.log(article.purchased_publication?.publication)
//           return article.purchased_publication?.publication?.name
//         })
//         // const publicationIds = articles.map((article) => article.publication)
//         // //need to fetch publications
//         // const publicationFetches = publicationIds.map((publicationId) => {
//         //   return strapi.entityService.findOne('api::publication.publication', publicationId, {

//         //   });
//         // })

//         // const publications = await Promise.all(publicationFetches).then((results) => {
//         //   return results
//         // }).catch((err) => {
//         //   console.log(err)
//         //   return err
//         // })

//         return emails.sendCampaignToAscend({clientName, campaignName, articleCount, articles, publicationNames, questionnaire, campaignLink})
//     } else {
  
//         // const publicationNames = articles.map((article) => {
//         //   return article.publication?.name
//         // })
  
//         if (result.status == "requires-action") {
//           console.log("sending edits to CLIENT")
//           //send email to client that campaign is pending
//           return emails.sendEditsToClient({clientEmail, articles, campaignLink})
//         } else if (result.status == "reviewing") {
//           console.log("sending edits to ASCEND")

//           return emails.sendEditsToAscend({clientEmail, clientName, articles, campaignName, campaignLink })
//         } else {

//           //send email to client that campaign is paid
//           return
//         }
//     }

//   }
// }