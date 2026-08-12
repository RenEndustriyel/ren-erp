import stockMovements from "../data/stockMovements";

const StockService = {

  add(data) {

    stockMovements.push({

      id: Date.now(),

      date: new Date().toLocaleString("tr-TR"),

      ...data

    });

    localStorage.setItem(
      "stockMovements",
      JSON.stringify(stockMovements)
    );

  }

};

export default StockService;