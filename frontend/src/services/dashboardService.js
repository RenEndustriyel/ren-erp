import sales from "../data/sales";
import purchases from "../data/purchases";
import customers from "../data/customers";
import products from "../data/products";
import cash from "../data/cash";

const DashboardService = {

    getSummary() {

        const today = new Date().toLocaleDateString("tr-TR");

        const todaySales =
            sales.filter(x =>
                x.date.includes(today)
            );

        const todayPurchases =
            purchases.filter(x =>
                x.date.includes(today)
            );

        const totalSales =
            sales.reduce(
                (t, x) => t + Number(x.total || 0),
                0
            );

        const totalPurchase =
            purchases.reduce(
                (t, x) => t + Number(x.total || 0),
                0
            );

        const totalProfit =
            totalSales - totalPurchase;

        const customerBalance =
            customers.reduce(
                (t, x) => t + Number(x.balance || 0),
                0
            );

        const cashBalance =
            cash.reduce((t, x) => {

                if (x.type === "Gelir")
                    return t + Number(x.amount);

                return t - Number(x.amount);

            }, 0);

        const criticalStock =
            products.filter(x =>
                Number(x.stock) <= Number(x.minStock || 0)
            ).length;

        return {

            totalSales,

            totalPurchase,

            totalProfit,

            customerBalance,

            cashBalance,

            productCount: products.length,

            todaySales: todaySales.length,

            todayPurchases: todayPurchases.length,

            criticalStock

        };

    }

};

export default DashboardService;