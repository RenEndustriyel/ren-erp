import purchases from "../data/purchases";
import ProductService from "./productService";
import StockService from "./stockService";

const PurchaseService={

getAll(){

return purchases;

},

add(data){

const product=
ProductService.getById(
data.productId
);

if(!product){

return{
success:false
};

}

ProductService.increaseStock(
data.productId,
data.qty
);

product.purchasePrice=
Number(data.price);

ProductService.update(product);

const total=
Number(data.price)*
Number(data.qty);

const purchase={

id:Date.now(),

date:new Date().toLocaleString("tr-TR"),

supplier:data.supplier,

product:product.name,

qty:Number(data.qty),

price:Number(data.price),

total

};

purchases.push(purchase);

localStorage.setItem(
"purchases",
JSON.stringify(purchases)
);

StockService.add({

product:product.name,

type:"Giriş",

qty:data.qty,

price:data.price,

total

});

return{

success:true,

purchase

};

}

};

export default PurchaseService;