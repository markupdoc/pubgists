require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY_PROD);

async function listCustomers() {
  let customers = await stripe.customers.list({ limit: 100 });

  // Loop through all customers
  while (customers.has_more) {
    customers = await stripe.customers.list({
      limit: 100,
      starting_after: customers.data[customers.data.length - 1].id,
    });

    for (const customer of customers.data) {
      let email = customer.email
        ? customer.email.toLowerCase().replace(/\.$/, '').trim()
        : '';

      // Sanitize customer email, remove "." if exists
      if (email.endsWith('.')) {
        email = email.slice(0, -1);
      }

      // Update customer email if needed
      if (email !== customer.email) {
        const updatedCustomer = await updateCustomerWithDelay(
          customer.id,
          email
        );
        console.log(
          `${customer.id}, ${customer.email}, ${updatedCustomer.email}`
        );
      }
    }
  }

  console.log(`All customer emails sanitized.`);
}

async function updateCustomerWithDelay(customerId, email) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      stripe.customers
        .update(customerId, { email: email })
        .then((updatedCustomer) => {
          resolve(updatedCustomer);
        })
        .catch((error) => {
          reject(error);
        });
    }, 1000); // Delay of 1 second between each update request
  });
}

listCustomers().catch(console.error);
