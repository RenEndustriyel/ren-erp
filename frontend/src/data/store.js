export function getSales(){

    return JSON.parse(
        localStorage.getItem("sales")
    ) || [];

}



export function saveSale(sale){


    const sales = getSales();


    sales.push(sale);


    localStorage.setItem(
        "sales",
        JSON.stringify(sales)
    );


    updateCustomerBalance(
        sale.customerId,
        sale.total,
        "satis"
    );


}






export function getPurchases(){


    return JSON.parse(
        localStorage.getItem("purchases")
    ) || [];

}







export function savePurchase(purchase){


    const purchases = getPurchases();


    purchases.push(purchase);


    localStorage.setItem(
        "purchases",
        JSON.stringify(purchases)
    );



    updateCustomerBalance(

        purchase.supplierId,

        purchase.total,

        "alis"

    );


}








export function updateCustomerBalance(

    id,

    amount,

    type

){



    const customers = JSON.parse(

        localStorage.getItem("customers")

    ) || [];





    const index = customers.findIndex(

        item => Number(item.id) === Number(id)

    );





    if(index === -1){

        console.log("Cari bulunamadı:", id);

        return;

    }





    let balance = Number(

        customers[index].balance || 0

    );





    if(type==="satis"){

        balance += Number(amount);

    }





    if(type==="alis"){

        balance -= Number(amount);

    }





    if(type==="tahsilat"){

        balance -= Number(amount);

    }





    if(type==="odeme"){

        balance += Number(amount);

    }





    customers[index].balance = balance;





    localStorage.setItem(

        "customers",

        JSON.stringify(customers)

    );



}









export function deleteSale(id){


    const sales = getSales();



    const sale = sales.find(

        item=>item.id===id

    );



    if(!sale){

        return;

    }






    const updatedSales = sales.filter(

        item=>item.id!==id

    );





    localStorage.setItem(

        "sales",

        JSON.stringify(updatedSales)

    );



}

export function getCustomers() {
    return JSON.parse(
        localStorage.getItem("customers")
    ) || [];
}

export function getProducts() {
    return JSON.parse(
        localStorage.getItem("products")
    ) || [];
}

export function getCash() {
    return JSON.parse(
        localStorage.getItem("cash")
    ) || [];
}

export function getCashBalance() {

    const cash = getCash();

    return cash.reduce(
        (total, item) => {

            if(item.type === "Gelir"){
                return total + Number(item.amount || 0);
            }

            if(item.type === "Gider"){
                return total - Number(item.amount || 0);
            }

            return total;

        },
        0
    );

}