import sales from "../data/sales";
import purchases from "../data/purchases";
import cash from "../data/cash";

const ActivityService = {

  getLastActivities() {

    const activities = [];

    sales.forEach(item => {

      activities.push({
        date: item.date,
        title: "Satış",
        detail: item.product,
        amount: item.total
      });

    });

    purchases.forEach(item => {

      activities.push({
        date: item.date,
        title: "Alış",
        detail: item.product,
        amount: item.total
      });

    });

    cash.forEach(item => {

      activities.push({
        date: item.date,
        title: item.type,
        detail: item.description,
        amount: item.amount
      });

    });

    return activities.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

  }

};

export default ActivityService;