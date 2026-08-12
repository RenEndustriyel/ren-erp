const STORAGE_KEY = "ren_sales";

const salesService = {

  getAll() {

    return JSON.parse(
      localStorage.getItem(STORAGE_KEY)
    ) || [];

  },

  add(sale) {

    const sales = this.getAll();

    sales.unshift({

      id: Date.now(),

      date: new Date().toLocaleString("tr-TR"),

      ...sale

    });

    localStorage.setItem(

      STORAGE_KEY,

      JSON.stringify(sales)

    );

  }

};

export default salesService;