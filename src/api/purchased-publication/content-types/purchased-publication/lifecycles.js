const algoliasearch = require('algoliasearch');

const INDEX_NAME = 'dev_publications'
module.exports = {
  async afterCreate(event) {
    const client = algoliasearch(process.env.ALGOLIA_APPLICATION_ID, process.env.ALGOLIA_ADMIN_API_KEY);
    const index = client.initIndex(INDEX_NAME);

    const {
      id,
      email,
      is_accounting_completed,
      accounting_completion_date,
      price,
      status,
      ref_id,
      purchase_date,
      publication_internal_cost,
      publication_sale_price,
      is_publisher_paid,
      is_reseller_paid,
      createdAt,
      updatedAt,
      publication,
      order,
      profile,
      article,
      site,
    } = event.result
    const object = {
      id,
      email,
      is_accounting_completed,
      accounting_completion_date,
      price,
      status,
      ref_id,
      purchase_date,
      publication_internal_cost,
      publication_sale_price,
      is_publisher_paid,
      is_reseller_paid,
      createdAt,
      updatedAt,
      publication,
      order,
      profile,
      article,
      site,
      objectID: id,
      has_no_artcile: !article
    }
    index
      .saveObject(object)
      .then(() => {
        console.log('Data uploaded in algolia')
      })
      .catch(err => {
        console.log(err);
      });
  },
  async afterUpdate(event) {
    const client = algoliasearch(process.env.ALGOLIA_APPLICATION_ID, process.env.ALGOLIA_ADMIN_API_KEY);
    const index = client.initIndex(INDEX_NAME);
    const {
      id,
      email,
      is_accounting_completed,
      accounting_completion_date,
      price,
      status,
      ref_id,
      purchase_date,
      publication_internal_cost,
      publication_sale_price,
      is_publisher_paid,
      is_reseller_paid,
      createdAt,
      updatedAt,
      publication,
      order,
      profile,
      article,
      site,
    } = event.result
    const object = {
      id,
      email,
      is_accounting_completed,
      accounting_completion_date,
      price,
      status,
      ref_id,
      purchase_date,
      publication_internal_cost,
      publication_sale_price,
      is_publisher_paid,
      is_reseller_paid,
      createdAt,
      updatedAt,
      publication,
      order,
      profile,
      article,
      site,
      objectID: id,
      has_no_artcile: !article
    }
    index
      .saveObject(object)
      .then(() => {
        console.log('Data updated in algolia')
      })
      .catch(err => {
        console.log(err);
      });
  },
  async afterDelete(event) {
    const client = algoliasearch(process.env.ALGOLIA_APPLICATION_ID, process.env.ALGOLIA_ADMIN_API_KEY);
    const index = client.initIndex(INDEX_NAME);
    index
      .deleteObject(event.result.id)
      .then(() => {
        console.log('Data removed from algolia')
      })
      .catch(err => {
        console.log(err);
      });
  },
}
