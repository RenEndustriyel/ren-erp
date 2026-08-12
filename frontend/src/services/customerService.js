import customers from "../data/customers";

const CustomerService = {

  getAll() {

    return customers;

  },

  addBalance(name, amount) {

    const customer =
      customers.find(
        x => x.name === name
      );

    if (!customer) return;

    customer.balance =
      Number(customer.balance || 0) +
      Number(amount);

    localStorage.setItem(
      "customers",
      JSON.stringify(customers)
    );

  }

};

export default CustomerService;