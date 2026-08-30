const PRODUCTS_KEY = "ren_erp_products";
const CATEGORIES_KEY = "ren_erp_categories";
const BRANDS_KEY = "ren_erp_brands";
const UNITS_KEY = "ren_erp_units";
const MOVEMENTS_KEY = "ren_erp_stock_movements";
const PRICE_HISTORY_KEY = "ren_erp_product_price_history";


const DEFAULT_CATEGORIES = [
  {
    id: 1,
    name: "Temizlik Ürünleri",
    description: "Genel temizlik ve hijyen ürünleri",
    status: "Aktif",
  },
  {
    id: 2,
    name: "Kağıt Ürünleri",
    description: "Tuvalet kağıdı, havlu ve peçete ürünleri",
    status: "Aktif",
  },
  {
    id: 3,
    name: "Ambalaj",
    description: "Poşet, bardak, kap ve ambalaj ürünleri",
    status: "Aktif",
  },
  {
    id: 4,
    name: "Deterjan",
    description: "Profesyonel ve ev tipi deterjanlar",
    status: "Aktif",
  },
  {
    id: 5,
    name: "Temizlik Ekipmanları",
    description: "Mop, fırça, süpürge ve ekipmanlar",
    status: "Aktif",
  },
];


const DEFAULT_BRANDS = [
  {
    id: 1,
    name: "Domestos",
    description: "Profesyonel temizlik ürünleri",
    status: "Aktif",
  },
  {
    id: 2,
    name: "Bingo",
    description: "Temizlik ve deterjan ürünleri",
    status: "Aktif",
  },
  {
    id: 3,
    name: "Tex",
    description: "Endüstriyel temizlik ürünleri",
    status: "Aktif",
  },
  {
    id: 4,
    name: "Selpak",
    description: "Kağıt ürünleri",
    status: "Aktif",
  },
  {
    id: 5,
    name: "Peros",
    description: "Deterjan ürünleri",
    status: "Aktif",
  },
];


const DEFAULT_UNITS = [
  {
    id: 1,
    name: "Adet",
    shortName: "Ad",
    description: "Tek tek satılan ürünler",
    status: "Aktif",
  },
  {
    id: 2,
    name: "Koli",
    shortName: "Koli",
    description: "Koli bazında ürünler",
    status: "Aktif",
  },
  {
    id: 3,
    name: "Paket",
    shortName: "Pkt",
    description: "Paket bazında ürünler",
    status: "Aktif",
  },
  {
    id: 4,
    name: "Kg",
    shortName: "Kg",
    description: "Kilogram bazında ürünler",
    status: "Aktif",
  },
  {
    id: 5,
    name: "Litre",
    shortName: "Lt",
    description: "Litre bazında ürünler",
    status: "Aktif",
  },
  {
    id: 6,
    name: "Metre",
    shortName: "Mt",
    description: "Metre bazında ürünler",
    status: "Aktif",
  },
];


/* =========================================================
   GENEL STORAGE
========================================================= */

function read(
  key,
  fallback = []
) {
  try {
    const raw =
      localStorage.getItem(
        key
      );

    if (!raw) {
      return fallback;
    }

    const parsed =
      JSON.parse(
        raw
      );

    return Array.isArray(
      parsed
    )
      ? parsed
      : fallback;

  } catch {
    return fallback;
  }
}


function write(
  key,
  value
) {
  localStorage.setItem(
    key,
    JSON.stringify(
      value
    )
  );
}


/* =========================================================
   SAYI
========================================================= */

function normalizeNumber(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

  if (
    typeof value ===
    "number"
  ) {
    return Number.isFinite(
      value
    )
      ? value
      : 0;
  }

  let text =
    String(
      value
    ).trim();

  if (
    text.includes(",") &&
    text.includes(".")
  ) {
    text =
      text
        .replace(
          /\./g,
          ""
        )
        .replace(
          ",",
          "."
        );

  } else if (
    text.includes(",")
  ) {
    text =
      text.replace(
        ",",
        "."
      );
  }

  const result =
    Number(
      text
    );

  return Number.isFinite(
    result
  )
    ? result
    : 0;
}


/* =========================================================
   KÂR
========================================================= */

function calculateProfit(
  purchaseNet,
  saleNet
) {
  const purchase =
    normalizeNumber(
      purchaseNet
    );

  const sale =
    normalizeNumber(
      saleNet
    );

  if (
    purchase <=
    0
  ) {
    return 0;
  }

  return (
    (
      (
        sale -
        purchase
      ) /
      purchase
    ) *
    100
  );
}


/* =========================================================
   STOK DURUMU
========================================================= */

function calculateStatus(
  stock,
  criticalStock = 15,
  active = true
) {
  if (!active) {
    return "passive";
  }

  const quantity =
    normalizeNumber(
      stock
    );

  const critical =
    normalizeNumber(
      criticalStock
    );

  const threshold =
    critical > 0
      ? critical
      : 15;

  if (
    quantity <=
    0
  ) {
    return "empty";
  }

  if (
    quantity <=
    threshold
  ) {
    return "low";
  }

  return "normal";
}


/* =========================================================
   ÜRÜNLER
========================================================= */

export function getProducts() {
  return read(
    PRODUCTS_KEY,
    []
  );
}


export function saveProducts(
  products
) {
  write(
    PRODUCTS_KEY,
    products
  );

  window.dispatchEvent(
    new Event(
      "ren-products-changed"
    )
  );

  return products;
}


export function getProductById(
  id
) {
  return getProducts().find(
    (
      product
    ) =>
      String(
        product.id
      ) ===
      String(
        id
      )
  );
}


export function getProductByCode(
  code
) {
  const normalized =
    String(
      code || ""
    )
      .trim()
      .toLocaleLowerCase(
        "tr-TR"
      );

  if (!normalized) {
    return null;
  }

  return getProducts().find(
    (
      product
    ) =>
      String(
        product.code || ""
      )
        .trim()
        .toLocaleLowerCase(
          "tr-TR"
        ) ===
      normalized
  );
}


export function getProductByBarcode(
  barcode
) {
  const normalized =
    String(
      barcode || ""
    ).trim();

  if (!normalized) {
    return null;
  }

  return getProducts().find(
    (
      product
    ) =>
      String(
        product.barcode || ""
      ).trim() ===
      normalized
  );
}


/* =========================================================
   ÜRÜN OLUŞTUR
========================================================= */

export function createProduct(
  productData
) {
  const products =
    getProducts();

  const name =
    String(
      productData.name || ""
    ).trim();

  const code =
    String(
      productData.code || ""
    ).trim();


  if (!name) {
    throw new Error(
      "Ürün adı zorunludur."
    );
  }


  if (!code) {
    throw new Error(
      "Ürün kodu zorunludur."
    );
  }


  const duplicateCode =
    products.some(
      (
        product
      ) =>
        String(
          product.code || ""
        )
          .trim()
          .toLocaleLowerCase(
            "tr-TR"
          ) ===
        code.toLocaleLowerCase(
          "tr-TR"
        )
    );


  if (duplicateCode) {
    throw new Error(
      "Bu ürün kodu zaten kullanılıyor."
    );
  }


  const purchaseNet =
    normalizeNumber(
      productData.purchaseNet
    );

  const purchaseGross =
    normalizeNumber(
      productData.purchaseGross
    );

  const salesNet =
    normalizeNumber(
      productData.salesNet
    );

  const salesGross =
    normalizeNumber(
      productData.salesGross
    );

  const stock =
    normalizeNumber(
      productData.openingStock
    );

  const criticalStock =
    normalizeNumber(
      productData.criticalStock
    );

  const active =
    productData.active !==
    false;


  const product = {
    id:
      productData.id ||
      `PRD-${Date.now()}`,

    name,

    code,

    barcode:
      productData.barcode ||
      "",

    category:
      productData.category ||
      "",

    brand:
      productData.brand ||
      "",

    model:
      productData.model ||
      "",

    unit:
      productData.unit ||
      "Adet",

    purchaseUnit:
      productData.purchaseUnit ||
      productData.unit ||
      "Adet",

    stockTracking:
      productData.stockTracking !==
      false,

    stock,

    openingStock:
      stock,

    criticalStock,

    criticalStockEnabled:
      Boolean(
        productData.criticalStockEnabled
      ),

    purchaseMode:
      productData.purchaseMode ||
      "exclusive",

    purchaseVat:
      normalizeNumber(
        productData.purchaseVat
      ),

    purchaseNet,

    purchaseGross,

    salesMode:
      productData.salesMode ||
      "exclusive",

    salesVat:
      normalizeNumber(
        productData.salesVat
      ),

    salesNet,

    salesGross,

    profitRate:
      normalizeNumber(
        productData.profitRate
      ) ||
      calculateProfit(
        purchaseNet,
        salesNet
      ),

    grossProfit:
      salesNet -
      purchaseNet,

    supplier:
      productData.supplier ||
      "",

    origin:
      productData.origin ||
      "",

    description:
      productData.description ||
      "",

    image:
      productData.image ||
      null,

    active,

    status:
      calculateStatus(
        stock,
        criticalStock,
        active
      ),

    createdAt:
      productData.createdAt ||
      new Date().toISOString(),

    updatedAt:
      new Date().toISOString(),
  };


  saveProducts([
    product,
    ...products,
  ]);


  if (
    stock !==
    0
  ) {

    addStockMovement({
      productId:
        product.id,

      productCode:
        product.code,

      product:
        product.name,

      quantity:
        stock,

      previousStock:
        0,

      newStock:
        stock,

      type:
        stock > 0
          ? "Stok Girişi"
          : "Stok Çıkışı",

      source:
        "Açılış",

      description:
        "Yeni ürün açılış stok kaydı.",
    });

  }


  return product;
}


/* =========================================================
   ÜRÜN GÜNCELLE
========================================================= */

export function updateProduct(
  id,
  changes
) {
  const products =
    getProducts();


  const index =
    products.findIndex(
      (
        product
      ) =>
        String(
          product.id
        ) ===
        String(
          id
        )
    );


  if (
    index ===
    -1
  ) {
    throw new Error(
      "Ürün bulunamadı."
    );
  }


  const current =
    products[index];


  const updated = {
    ...current,
    ...changes,
    updatedAt:
      new Date().toISOString(),
  };


  const stock =
    normalizeNumber(
      updated.stock
    );


  updated.stock =
    stock;


  updated.status =
    calculateStatus(
      stock,
      updated.criticalStock,
      updated.active
    );


  updated.profitRate =
    calculateProfit(
      updated.purchaseNet,
      updated.salesNet
    );


  updated.grossProfit =
    normalizeNumber(
      updated.salesNet
    ) -
    normalizeNumber(
      updated.purchaseNet
    );


  const nextProducts =
    [
      ...products,
    ];


  nextProducts[index] =
    updated;


  saveProducts(
    nextProducts
  );


  return updated;
}


/* =========================================================
   ÜRÜN SİL
========================================================= */

export function deleteProduct(
  id
) {
  const products =
    getProducts();


  const product =
    products.find(
      (
        item
      ) =>
        String(
          item.id
        ) ===
        String(
          id
        )
    );


  if (!product) {
    return false;
  }


  saveProducts(
    products.filter(
      (
        item
      ) =>
        String(
          item.id
        ) !==
        String(
          id
        )
    )
  );


  return true;
}


/* =========================================================
   KATEGORİLER
========================================================= */

export function getCategories() {
  const existing =
    read(
      CATEGORIES_KEY,
      []
    );


  if (
    existing.length ===
    0
  ) {

    write(
      CATEGORIES_KEY,
      DEFAULT_CATEGORIES
    );

    return DEFAULT_CATEGORIES;

  }


  return existing;
}


export function saveCategories(
  categories
) {
  write(
    CATEGORIES_KEY,
    categories
  );


  window.dispatchEvent(
    new Event(
      "ren-categories-changed"
    )
  );


  return categories;
}


/* =========================================================
   MARKALAR
========================================================= */

export function getBrands() {
  const existing =
    read(
      BRANDS_KEY,
      []
    );


  if (
    existing.length ===
    0
  ) {

    write(
      BRANDS_KEY,
      DEFAULT_BRANDS
    );

    return DEFAULT_BRANDS;

  }


  return existing;
}


export function saveBrands(
  brands
) {
  write(
    BRANDS_KEY,
    brands
  );


  window.dispatchEvent(
    new Event(
      "ren-brands-changed"
    )
  );


  return brands;
}


/* =========================================================
   BİRİMLER
========================================================= */

export function getUnits() {
  const existing =
    read(
      UNITS_KEY,
      []
    );


  if (
    existing.length ===
    0
  ) {

    write(
      UNITS_KEY,
      DEFAULT_UNITS
    );

    return DEFAULT_UNITS;

  }


  return existing;
}


export function saveUnits(
  units
) {
  write(
    UNITS_KEY,
    units
  );


  window.dispatchEvent(
    new Event(
      "ren-units-changed"
    )
  );


  return units;
}


/* =========================================================
   STOK HAREKETLERİ
========================================================= */

export function getStockMovements() {
  return read(
    MOVEMENTS_KEY,
    []
  );
}


export function saveStockMovements(
  movements
) {
  write(
    MOVEMENTS_KEY,
    movements
  );


  window.dispatchEvent(
    new Event(
      "ren-stock-movements-changed"
    )
  );


  return movements;
}


export function addStockMovement(
  movementData
) {
  const movements =
    getStockMovements();


  const movement = {
    id:
      movementData.id ||
      `MOV-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}`,

    date:
      movementData.date ||
      new Date().toLocaleDateString(
        "tr-TR"
      ),

    time:
      movementData.time ||
      new Date().toLocaleTimeString(
        "tr-TR",
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      ),

    productId:
      movementData.productId ||
      "",

    productCode:
      movementData.productCode ||
      "",

    product:
      movementData.product ||
      "",

    quantity:
      normalizeNumber(
        movementData.quantity
      ),

    previousStock:
      normalizeNumber(
        movementData.previousStock
      ),

    newStock:
      normalizeNumber(
        movementData.newStock
      ),

    type:
      movementData.type ||
      "Düzeltme",

    source:
      movementData.source ||
      "Manuel",

    description:
      movementData.description ||
      "",

    createdAt:
      new Date().toISOString(),
  };


  saveStockMovements([
    movement,
    ...movements,
  ]);


  return movement;
}


/* =========================================================
   STOK DEĞİŞİKLİĞİ
========================================================= */

export function changeStock(
  productId,
  quantity,
  options = {}
) {
  const product =
    getProductById(
      productId
    );


  if (!product) {

    throw new Error(
      "Stok değişikliği yapılacak ürün bulunamadı."
    );

  }


  const amount =
    normalizeNumber(
      quantity
    );


  const previousStock =
    normalizeNumber(
      product.stock
    );


  /*
    SATIŞTA STOK YETERSİZSE:
    Fatura işlemi durmaz.
    Stok negatife inmez.
    Minimum 0 olur.
  */


  const rawNewStock =
    previousStock +
    amount;


  const newStock =
    rawNewStock <
    0
      ? 0
      : rawNewStock;


  const actualChange =
    newStock -
    previousStock;


  const updated =
    updateProduct(
      product.id,
      {
        stock:
          newStock,
      }
    );


  addStockMovement({
    productId:
      product.id,

    productCode:
      product.code,

    product:
      product.name,

    quantity:
      actualChange,

    previousStock,

    newStock,

    type:
      options.type ||
      (
        amount >=
        0
          ? "Stok Girişi"
          : "Stok Çıkışı"
      ),

    source:
      options.source ||
      "Manuel",

    description:
      options.description ||
      (
        amount <
          0 &&
        newStock ===
          0 &&
        previousStock +
          amount <
          0
          ? "Stok yetersiz olduğu için stok 0'a çekildi; satış/fatura işlemi tamamlandı."
          : "Manuel stok değişikliği."
      ),
  });


  return updated;
}


/* =========================================================
   FİYAT GEÇMİŞİ
========================================================= */

export function getProductPriceHistory(
  productId
) {
  return read(
    PRICE_HISTORY_KEY,
    []
  )
    .filter(
      (
        item
      ) =>
        String(
          item.productId
        ) ===
        String(
          productId
        )
    )
    .sort(
      (
        a,
        b
      ) =>
        String(
          b.date ||
          b.createdAt ||
          ""
        ).localeCompare(
          String(
            a.date ||
            a.createdAt ||
            ""
          )
        )
    );
}


export function getAllProductPriceHistory() {
  return read(
    PRICE_HISTORY_KEY,
    []
  );
}


export function addProductPriceHistory(
  data
) {
  const history =
    read(
      PRICE_HISTORY_KEY,
      []
    );


  const oldPrice =
    normalizeNumber(
      data.oldPrice
    );


  const newPrice =
    normalizeNumber(
      data.newPrice
    );


  const changeAmount =
    newPrice -
    oldPrice;


  const changePercent =
    oldPrice >
    0
      ? (
          (
            changeAmount /
            oldPrice
          ) *
          100
        )
      : 0;


  const record = {

    id:
      data.id ||
      `PRICE-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,

    productId:
      data.productId ||
      "",

    productCode:
      data.productCode ||
      "",

    productName:
      data.productName ||
      "",

    priceType:
      data.priceType ||
      "purchase",

    oldPrice,

    newPrice,

    changeAmount,

    changePercent,

    supplierId:
      data.supplierId ||
      "",

    supplierName:
      data.supplierName ||
      "",

    invoiceId:
      data.invoiceId ||
      "",

    invoiceNo:
      data.invoiceNo ||
      "",

    date:
      data.date ||
      new Date().toISOString(),

    createdAt:
      new Date().toISOString(),

  };


  write(
    PRICE_HISTORY_KEY,
    [
      record,
      ...history,
    ]
  );


  window.dispatchEvent(
    new Event(
      "ren-product-price-history-changed"
    )
  );


  return record;
}


/* =========================================================
   TOPLU İŞLEMLER
========================================================= */

export function updateProductsBulk(
  ids,
  changes
) {
  const selectedIds =
    Array.isArray(
      ids
    )
      ? ids.map(
          (id) =>
            String(
              id
            )
        )
      : [];


  if (
    selectedIds.length ===
    0
  ) {
    return [];
  }


  const products =
    getProducts();


  const updatedProducts =
    products.map(
      (
        product
      ) => {

        if (
          !selectedIds.includes(
            String(
              product.id
            )
          )
        ) {
          return product;
        }


        const updated = {
          ...product,
          ...changes,
          updatedAt:
            new Date().toISOString(),
        };


        updated.status =
          calculateStatus(
            updated.stock,
            updated.criticalStock,
            updated.active
          );


        updated.profitRate =
          calculateProfit(
            updated.purchaseNet,
            updated.salesNet
          );


        updated.grossProfit =
          normalizeNumber(
            updated.salesNet
          ) -
          normalizeNumber(
            updated.purchaseNet
          );


        return updated;

      }
    );


  saveProducts(
    updatedProducts
  );


  return updatedProducts.filter(
    (
      product
    ) =>
      selectedIds.includes(
        String(
          product.id
        )
      )
  );
}


/* =========================================================
   YENİDEN HESAPLA
========================================================= */

export function recalculateProduct(
  product
) {
  if (!product) {
    return null;
  }


  const purchaseNet =
    normalizeNumber(
      product.purchaseNet
    );


  const salesNet =
    normalizeNumber(
      product.salesNet
    );


  const profitRate =
    calculateProfit(
      purchaseNet,
      salesNet
    );


  return {

    ...product,

    purchaseNet,

    purchaseGross:
      normalizeNumber(
        product.purchaseGross
      ),

    salesNet,

    salesGross:
      normalizeNumber(
        product.salesGross
      ),

    profitRate,

    grossProfit:
      salesNet -
      purchaseNet,

    status:
      calculateStatus(
        product.stock,
        product.criticalStock,
        product.active
      ),

  };
}


/* =========================================================
   BAŞLAT
========================================================= */

export function initializeStockStore() {
  getCategories();
  getBrands();
  getUnits();
  getProducts();
  getStockMovements();
  read(
    PRICE_HISTORY_KEY,
    []
  );
}


/* =========================================================
   KEY'LER
========================================================= */

export const STOCK_KEYS = {
  PRODUCTS_KEY,
  CATEGORIES_KEY,
  BRANDS_KEY,
  UNITS_KEY,
  MOVEMENTS_KEY,
  PRICE_HISTORY_KEY,
};