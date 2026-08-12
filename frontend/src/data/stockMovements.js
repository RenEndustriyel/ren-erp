const stockMovements =
JSON.parse(localStorage.getItem("stockMovements")) || [];

export default stockMovements;