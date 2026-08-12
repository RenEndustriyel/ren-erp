const STORAGE_KEY = "cash";

export function getCashMovements() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function save(movements) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(movements));
}

export function addCashMovement(data) {
  const movements = getCashMovements();

  const movement = {
    id: Date.now(),
    type: data.type, // gelir | gider | tahsilat | odeme
    title: data.title || "",
    customerId: data.customerId || null,
    customer: data.customer || "",
    amount: Number(data.amount),
    date: new Date().toLocaleString("tr-TR"),
    note: data.note || "",
  };

  movements.unshift(movement);

  save(movements);

  return movement;
}

export function deleteCashMovement(id) {
  const movements = getCashMovements().filter(
    (item) => Number(item.id) !== Number(id)
  );

  save(movements);
}

export function getCashBalance() {
  return getCashMovements().reduce((total, item) => {
    switch (item.type) {
      case "gelir":
      case "tahsilat":
        return total + Number(item.amount);

      case "gider":
      case "odeme":
        return total - Number(item.amount);

      default:
        return total;
    }
  }, 0);
}

export function getTodayCash() {
  const today = new Date().toLocaleDateString("tr-TR");

  return getCashMovements().filter((item) =>
    item.date.startsWith(today)
  );
}

export default getCashMovements();