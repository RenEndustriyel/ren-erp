import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  MdArrowDownward,
  MdArrowUpward,
  MdCalendarToday,
  MdClose,
  MdInventory2,
  MdRefresh,
  MdSearch,
  MdSwapVert,
  MdTrendingUp,
} from "react-icons/md";

import {
  useNavigate,
} from "react-router-dom";

import "./StockMovements.css";


const PRODUCTS_KEY =
  "ren_erp_products";

const MOVEMENTS_KEY =
  "ren_erp_stock_movements";


/* =========================================================
   YARDIMCI
========================================================= */

function readStorage(
  key,
  fallback = []
) {
  try {
    const value =
      localStorage.getItem(key);

    if (!value) {
      return fallback;
    }

    const parsed =
      JSON.parse(value);

    return Array.isArray(parsed)
      ? parsed
      : fallback;

  } catch {
    return fallback;
  }
}


function writeStorage(
  key,
  value
) {
  localStorage.setItem(
    key,
    JSON.stringify(value)
  );
}


function numberValue(
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
    typeof value === "number"
  ) {
    return Number.isFinite(value)
      ? value
      : 0;
  }

  let text =
    String(value)
      .trim()
      .replace(/\s/g, "");

  if (
    text.includes(",") &&
    text.includes(".")
  ) {
    text =
      text
        .replace(/\./g, "")
        .replace(",", ".");
  } else {
    text =
      text.replace(",", ".");
  }

  const result =
    Number(text);

  return Number.isFinite(result)
    ? result
    : 0;
}


function formatNumber(
  value
) {
  return new Intl.NumberFormat(
    "tr-TR",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  ).format(
    numberValue(value)
  );
}


function formatDate(
  value
) {
  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "tr-TR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}


function todayInput() {
  const date =
    new Date();

  return (
    `${date.getFullYear()}-` +
    `${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-` +
    `${String(
      date.getDate()
    ).padStart(2, "0")}`
  );
}


/* =========================================================
   HAREKET TİPİ
========================================================= */

function getMovementType(
  movement
) {
  const type =
    String(
      movement?.type ||
      movement?.movementType ||
      movement?.action ||
      ""
    ).toLocaleLowerCase(
      "tr-TR"
    );


  if (
    type.includes("giriş") ||
    type.includes("giris") ||
    type.includes("alış") ||
    type.includes("alis") ||
    type.includes("opening") ||
    type.includes("açılış") ||
    type.includes("acilis")
  ) {
    return "in";
  }


  if (
    type.includes("çıkış") ||
    type.includes("cikis") ||
    type.includes("satış") ||
    type.includes("satis")
  ) {
    return "out";
  }


  if (
    type.includes("düzelt") ||
    type.includes("duzelt") ||
    type.includes("sayım") ||
    type.includes("sayim")
  ) {
    return "adjustment";
  }


  const quantity =
    numberValue(
      movement?.quantity ??
      movement?.amount ??
      movement?.change
    );


  if (
    quantity > 0
  ) {
    return "in";
  }


  if (
    quantity < 0
  ) {
    return "out";
  }


  return "adjustment";
}


function getMovementLabel(
  movement
) {
  const type =
    getMovementType(
      movement
    );


  if (
    type === "in"
  ) {
    return "Stok Girişi";
  }


  if (
    type === "out"
  ) {
    return "Stok Çıkışı";
  }


  return "Stok Düzeltme";
}


/* =========================================================
   ÜRÜN EŞLEŞTİR
========================================================= */

function findProductForMovement(
  movement,
  products
) {
  const rawProductId =
    movement?.productId ??
    movement?.product_id ??
    movement?.product ??
    "";


  const rawProductCode =
    movement?.productCode ??
    movement?.product_code ??
    movement?.code ??
    "";


  const rawProductName =
    movement?.productName ??
    movement?.product_name ??
    "";


  /* 1 — ID */

  let product =
    products.find(
      (item) =>
        String(
          item.id
        ) ===
        String(
          rawProductId
        )
    );


  if (product) {
    return product;
  }


  /* 2 — KOD */

  if (rawProductCode) {

    product =
      products.find(
        (item) =>
          String(
            item.code ??
            ""
          )
            .trim()
            .toLocaleLowerCase(
              "tr-TR"
            ) ===
          String(
            rawProductCode
          )
            .trim()
            .toLocaleLowerCase(
              "tr-TR"
            )
      );


    if (product) {
      return product;
    }

  }


  /* 3 — AD */

  if (rawProductName) {

    product =
      products.find(
        (item) =>
          String(
            item.name ??
            ""
          )
            .trim()
            .toLocaleLowerCase(
              "tr-TR"
            ) ===
          String(
            rawProductName
          )
            .trim()
            .toLocaleLowerCase(
              "tr-TR"
            )
      );


    if (product) {
      return product;
    }

  }


  return null;
}


/* =========================================================
   NORMALİZE
========================================================= */

function normalizeMovement(
  movement,
  products
) {
  const rawProductId =
    movement?.productId ??
    movement?.product_id ??
    movement?.product ??
    "";


  const rawProductCode =
    movement?.productCode ??
    movement?.product_code ??
    movement?.code ??
    "";


  const rawProductName =
    movement?.productName ??
    movement?.product_name ??
    "";


  const product =
    findProductForMovement(
      movement,
      products
    );


  const productId =
    product?.id ??
    rawProductId;


  const rawQuantity =
    numberValue(
      movement?.quantity ??
      movement?.amount ??
      movement?.change
    );


  const type =
    getMovementType(
      movement
    );


  const previousStock =
    numberValue(
      movement?.previousStock ??
      movement?.beforeStock
    );


  const newStock =
    numberValue(
      movement?.newStock ??
      movement?.afterStock
    );


  let quantity =
    Math.abs(
      rawQuantity
    );


  if (
    type === "adjustment"
  ) {

    quantity =
      Math.abs(
        newStock -
        previousStock
      );

  }


  const signedQuantity =
    type === "out"
      ? -quantity
      : type === "adjustment"
      ? newStock -
        previousStock
      : quantity;


  return {

    ...movement,

    id:
      movement?.id ??
      `MOV-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}`,

    productId,

    productName:
      product?.name ||
      rawProductName ||
      "Bilinmeyen Ürün",

    productCode:
      product?.code ||
      rawProductCode ||
      "-",

    category:
      product?.category ||
      movement?.category ||
      "-",

    brand:
      product?.brand ||
      movement?.brand ||
      "-",

    unit:
      product?.unit ||
      movement?.unit ||
      "Adet",

    type,

    typeLabel:
      getMovementLabel(
        movement
      ),

    quantity,

    signedQuantity,

    previousStock,

    newStock,

    date:
      movement?.date ||
      movement?.createdAt ||
      movement?.timestamp ||
      new Date().toISOString(),

    source:
      movement?.source ||
      "REN ERP",

    description:
      movement?.description ||
      movement?.note ||
      "-",

    user:
      movement?.user ||
      "Sistem",

  };
}


/* =========================================================
   COMPONENT
========================================================= */

export default function StockMovements() {

  const navigate =
    useNavigate();


  const [
    products,
    setProducts,
  ] = useState([]);


  const [
    movements,
    setMovements,
  ] = useState([]);


  const [
    search,
    setSearch,
  ] = useState("");


  const [
    typeFilter,
    setTypeFilter,
  ] = useState("all");


  const [
    productFilter,
    setProductFilter,
  ] = useState("");


  const [
    dateFilter,
    setDateFilter,
  ] = useState("");


  const [
    selectedProduct,
    setSelectedProduct,
  ] = useState(null);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    selectedMovement,
    setSelectedMovement,
  ] = useState(null);


  const [
    editingMovement,
    setEditingMovement,
  ] = useState(null);


  const [
    movementForm,
    setMovementForm,
  ] = useState({
    productId: "",
    type: "in",
    quantity: "",
    date: todayInput(),
    source: "REN ERP",
    description: "",
  });


  /* =======================================================
     URL
  ======================================================= */

  useEffect(() => {

    const params =
      new URLSearchParams(
        window.location.search
      );


    const productId =
      params.get(
        "productId"
      );


    if (productId) {

      setSelectedProduct(
        productId
      );

      setProductFilter(
        productId
      );

    }

  }, []);


  /* =======================================================
     VERİLER
  ======================================================= */

  const loadData =
    () => {

      setLoading(
        true
      );


      const storedProducts =
        readStorage(
          PRODUCTS_KEY
        );


      const storedMovements =
        readStorage(
          MOVEMENTS_KEY
        );


      setProducts(
        storedProducts
      );


      const normalized =
        storedMovements
          .map(
            (movement) =>
              normalizeMovement(
                movement,
                storedProducts
              )
          )
          .sort(
            (a, b) =>
              new Date(
                b.date
              ) -
              new Date(
                a.date
              )
          );


      setMovements(
        normalized
      );


      setLoading(
        false
      );

    };


  useEffect(() => {

    loadData();


    const refresh =
      () => {
        loadData();
      };


    const events = [
      "storage",
      "ren-products-changed",
      "ren-stock-movements-changed",
      "ren-stock-changed",
      "ren-stock-updated",
    ];


    events.forEach(
      (
        event
      ) => {

        window.addEventListener(
          event,
          refresh
        );

      }
    );


    return () => {

      events.forEach(
        (
          event
        ) => {

          window.removeEventListener(
            event,
            refresh
          );

        }
      );

    };

  }, []);


  /* =======================================================
     FİLTRE
  ======================================================= */

  const filteredMovements =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLocaleLowerCase(
            "tr-TR"
          );


      return movements.filter(
        (
          movement
        ) => {

          const matchesSearch =
            !query ||
            String(
              movement.productName
            )
              .toLocaleLowerCase(
                "tr-TR"
              )
              .includes(
                query
              ) ||
            String(
              movement.productCode
            )
              .toLocaleLowerCase(
                "tr-TR"
              )
              .includes(
                query
              ) ||
            String(
              movement.source
            )
              .toLocaleLowerCase(
                "tr-TR"
              )
              .includes(
                query
              ) ||
            String(
              movement.description
            )
              .toLocaleLowerCase(
                "tr-TR"
              )
              .includes(
                query
              );


          const matchesType =
            typeFilter ===
              "all" ||
            movement.type ===
              typeFilter;


          const matchesProduct =
            !productFilter ||
            String(
              movement.productId
            ) ===
            String(
              productFilter
            );


          let matchesDate =
            true;


          if (
            dateFilter
          ) {

            const movementDate =
              new Date(
                movement.date
              );


            if (
              Number.isNaN(
                movementDate.getTime()
              )
            ) {

              matchesDate =
                false;

            } else {

              const localDate =
                `${movementDate.getFullYear()}-${String(
                  movementDate.getMonth() + 1
                ).padStart(
                  2,
                  "0"
                )}-${String(
                  movementDate.getDate()
                ).padStart(
                  2,
                  "0"
                )}`;


              matchesDate =
                localDate ===
                dateFilter;

            }

          }


          return (
            matchesSearch &&
            matchesType &&
            matchesProduct &&
            matchesDate
          );

        }
      );

    }, [
      movements,
      search,
      typeFilter,
      productFilter,
      dateFilter,
    ]);


  /* =======================================================
     ÖZET
  ======================================================= */

  const summary =
    useMemo(() => {

      let totalIn = 0;
      let totalOut = 0;


      filteredMovements.forEach(
        (
          movement
        ) => {

          if (
            movement.type ===
            "in"
          ) {

            totalIn +=
              numberValue(
                movement.quantity
              );

          }


          if (
            movement.type ===
            "out"
          ) {

            totalOut +=
              numberValue(
                movement.quantity
              );

          }

        }
      );


      return {

        count:
          filteredMovements.length,

        totalIn,

        totalOut,

        net:
          totalIn -
          totalOut,

      };

    }, [
      filteredMovements,
    ]);


  /* =======================================================
     FİLTRE ÜRÜN
  ======================================================= */

  const handleProductChange =
    (
      productId
    ) => {

      setProductFilter(
        productId
      );


      setSelectedProduct(
        productId ||
        null
      );

    };


  const clearFilters =
    () => {

      setSearch("");

      setTypeFilter(
        "all"
      );

      setProductFilter(
        ""
      );

      setSelectedProduct(
        null
      );

      setDateFilter(
        ""
      );

    };


  /* =======================================================
     SEÇİLİ ÜRÜN
  ======================================================= */

  const selectedProductData =
    useMemo(() => {

      if (
        !productFilter
      ) {
        return null;
      }


      return products.find(
        (
          product
        ) =>
          String(
            product.id
          ) ===
          String(
            productFilter
          )
      ) || null;

    }, [
      products,
      productFilter,
    ]);


  /* =======================================================
     ÜRÜN DETAY
  ======================================================= */

  const openProductDetail =
    (
      productId
    ) => {

      if (
        productId ===
          undefined ||
        productId ===
          null ||
        productId ===
          ""
      ) {
        return;
      }


      navigate(
        `/stock/edit/${encodeURIComponent(
          productId
        )}`
      );

    };


  /* =======================================================
     HAREKET DETAY
  ======================================================= */

  const openMovementDetail =
    (
      movement
    ) => {

      setSelectedMovement(
        movement
      );

    };


  /* =======================================================
     HAREKET ETKİSİ
  ======================================================= */

  const getMovementEffect =
    (
      movement
    ) => {

      if (
        !movement
      ) {
        return 0;
      }


      if (
        movement.type ===
        "adjustment"
      ) {

        return (
          numberValue(
            movement.newStock
          ) -
          numberValue(
            movement.previousStock
          )
        );

      }


      const quantity =
        numberValue(
          movement.quantity
        );


      return movement.type ===
        "out"
        ? -Math.abs(
            quantity
          )
        : Math.abs(
            quantity
          );

    };


  /* =======================================================
     STOK DEĞİŞTİR
  ======================================================= */

  const applyProductStockDelta =
    (
      productId,
      delta
    ) => {

      const currentProducts =
        readStorage(
          PRODUCTS_KEY
        );


      const index =
        currentProducts.findIndex(
          (
            product
          ) =>
            String(
              product.id
            ) ===
            String(
              productId
            )
        );


      if (
        index ===
        -1
      ) {

        throw new Error(
          "Stok değişikliği yapılacak ürün bulunamadı."
        );

      }


      const currentProduct =
        currentProducts[
          index
        ];


      const currentStock =
        numberValue(
          currentProduct.stock
        );


      const nextStock =
        Math.max(
          0,
          currentStock +
          delta
        );


      currentProducts[
        index
      ] = {

        ...currentProduct,

        stock:
          nextStock,

        updatedAt:
          new Date()
            .toISOString(),

      };


      writeStorage(
        PRODUCTS_KEY,
        currentProducts
      );


      window.dispatchEvent(
        new Event(
          "ren-products-changed"
        )
      );


      window.dispatchEvent(
        new Event(
          "ren-stock-updated"
        )
      );


      return {

        product:
          currentProducts[
            index
          ],

        previousStock:
          currentStock,

        newStock:
          nextStock,

      };

    };


  /* =======================================================
     HAREKET SİL
  ======================================================= */

  const deleteMovement =
    (
      movement
    ) => {

      const confirmed =
        window.confirm(
          `${movement.productName} hareketini silmek istediğinize emin misiniz?\n\n` +
          `İşlem: ${movement.typeLabel}\n` +
          `Miktar: ${formatNumber(
            movement.quantity
          )} ${movement.unit}\n\n` +
          `Silindiğinde ürün stoğu da otomatik düzeltilecektir.`
        );


      if (
        !confirmed
      ) {
        return;
      }


      try {

        const delta =
          getMovementEffect(
            movement
          );


        /*
         * Ürün mevcutsa stok etkisini
         * geri al.
         *
         * Eşleşmeyen eski kayıt varsa,
         * hareketi yine de silebil.
         */

        if (
          delta !== 0 &&
          movement.productId
        ) {

          try {

            applyProductStockDelta(
              movement.productId,
              -delta
            );

          } catch (
            stockError
          ) {

            console.warn(
              "Hareketin bağlı olduğu ürün bulunamadı. Stok geri alma atlandı.",
              stockError
            );

          }

        }


        const currentMovements =
          readStorage(
            MOVEMENTS_KEY
          );


        const updatedMovements =
          currentMovements.filter(
            (
              item
            ) =>
              String(
                item.id
              ) !==
              String(
                movement.id
              )
          );


        writeStorage(
          MOVEMENTS_KEY,
          updatedMovements
        );


        window.dispatchEvent(
          new Event(
            "ren-stock-movements-changed"
          )
        );


        setSelectedMovement(
          null
        );


        loadData();

      } catch (
        error
      ) {

        console.error(
          "REN ERP stok hareketi silme hatası:",
          error
        );


        alert(
          error?.message ||
          "Stok hareketi silinemedi."
        );

      }

    };


  /* =======================================================
     DÜZENLE AÇ
  ======================================================= */

  const openMovementEdit =
    (
      movement
    ) => {

      setEditingMovement(
        movement
      );


      setSelectedMovement(
        null
      );


      let editType =
        movement.type;


      let editQuantity =
        movement.quantity;


      if (
        movement.type ===
        "adjustment"
      ) {

        const delta =
          numberValue(
            movement.newStock
          ) -
          numberValue(
            movement.previousStock
          );


        editType =
          delta >=
          0
            ? "in"
            : "out";


        editQuantity =
          Math.abs(
            delta
          );

      }


      const rawDate =
        String(
          movement.date ||
          ""
        );


      let editDate =
        todayInput();


      if (
        /^\d{4}-\d{2}-\d{2}$/.test(
          rawDate
        )
      ) {

        editDate =
          rawDate;

      } else {

        const parsed =
          new Date(
            rawDate
          );


        if (
          !Number.isNaN(
            parsed.getTime()
          )
        ) {

          editDate =
            `${parsed.getFullYear()}-${String(
              parsed.getMonth() + 1
            ).padStart(
              2,
              "0"
            )}-${String(
              parsed.getDate()
            ).padStart(
              2,
              "0"
            )}`;

        }

      }


      setMovementForm({

        productId:
          movement.productId ||
          "",

        type:
          editType,

        quantity:
          String(
            editQuantity ??
            ""
          ),

        date:
          editDate,

        source:
          movement.source ||
          "REN ERP",

        description:
          movement.description ===
          "-"
            ? ""
            : movement.description ||
              "",

      });

    };


  /* =======================================================
     DÜZENLE İPTAL
  ======================================================= */

  const cancelMovementEdit =
    () => {

      setEditingMovement(
        null
      );


      setMovementForm({

        productId:
          "",

        type:
          "in",

        quantity:
          "",

        date:
          todayInput(),

        source:
          "REN ERP",

        description:
          "",

      });

    };


  /* =======================================================
     DÜZENLE KAYDET
  ======================================================= */

  const saveMovementEdit =
    () => {

      if (
        !editingMovement
      ) {
        return;
      }


      const quantity =
        numberValue(
          movementForm.quantity
        );


      if (
        quantity <=
        0
      ) {

        alert(
          "Miktar 0'dan büyük olmalıdır."
        );

        return;

      }


      const newProduct =
        products.find(
          (
            product
          ) =>
            String(
              product.id
            ) ===
            String(
              movementForm.productId
            )
        );


      if (
        !newProduct
      ) {

        alert(
          "Seçilen ürün bulunamadı."
        );

        return;

      }


      const oldDelta =
        getMovementEffect(
          editingMovement
        );


      const newDelta =
        movementForm.type ===
        "out"
          ? -Math.abs(
              quantity
            )
          : Math.abs(
              quantity
            );


      /*
       * Eski etkiyi geri al.
       */

      if (
        editingMovement.productId
      ) {

        try {

          applyProductStockDelta(
            editingMovement.productId,
            -oldDelta
          );

        } catch (
          error
        ) {

          console.warn(
            "Eski hareketin ürünü bulunamadı:",
            error
          );

        }

      }


      /*
       * Yeni etkiyi uygula.
       */

      let applied;


      try {

        applied =
          applyProductStockDelta(
            newProduct.id,
            newDelta
          );

      } catch (
        error
      ) {

        /*
         * Yeni hareket uygulanamadıysa
         * eski etkiyi geri koy.
         */

        try {

          if (
            editingMovement.productId
          ) {

            applyProductStockDelta(
              editingMovement.productId,
              oldDelta
            );

          }

        } catch {
          /* geri alma mümkün değilse
             orijinal ürün korunur */
        }


        alert(
          error?.message ||
          "Yeni stok hareketi uygulanamadı."
        );

        return;

      }


      const currentMovements =
        readStorage(
          MOVEMENTS_KEY
        );


      const updatedMovement = {

        ...editingMovement,

        productId:
          newProduct.id,

        productName:
          newProduct.name,

        productCode:
          newProduct.code,

        category:
          newProduct.category,

        brand:
          newProduct.brand,

        unit:
          newProduct.unit ||
          "Adet",

        type:
          movementForm.type,

        typeLabel:
          movementForm.type ===
          "out"
            ? "Stok Çıkışı"
            : "Stok Girişi",

        quantity:
          Math.abs(
            quantity
          ),

        signedQuantity:
          newDelta,

        previousStock:
          applied.previousStock,

        newStock:
          applied.newStock,

        date:
          movementForm.date,

        source:
          movementForm.source.trim() ||
          "REN ERP",

        description:
          movementForm.description.trim() ||
          "-",

        updatedAt:
          new Date()
            .toISOString(),

      };


      const updatedMovements =
        currentMovements.map(
          (
            item
          ) =>
            String(
              item.id
            ) ===
            String(
              editingMovement.id
            )
              ? updatedMovement
              : item
        );


      writeStorage(
        MOVEMENTS_KEY,
        updatedMovements
      );


      window.dispatchEvent(
        new Event(
          "ren-products-changed"
        )
      );


      window.dispatchEvent(
        new Event(
          "ren-stock-updated"
        )
      );


      window.dispatchEvent(
        new Event(
          "ren-stock-movements-changed"
        )
      );


      cancelMovementEdit();


      loadData();

    };


  /* =======================================================
     AÇILIŞ STOKLARI
  ======================================================= */

  const createOpeningMovements =
    () => {

      const currentProducts =
        readStorage(
          PRODUCTS_KEY
        );


      const currentMovements =
        readStorage(
          MOVEMENTS_KEY
        );


      const existingProductIds =
        new Set(

          currentMovements
            .filter(
              (
                movement
              ) => {

                const type =
                  String(
                    movement.type ||
                    ""
                  )
                    .toLocaleLowerCase(
                      "tr-TR"
                    );


                return (
                  type.includes(
                    "açılış"
                  ) ||
                  type.includes(
                    "acilis"
                  )
                );

              }
            )
            .map(
              (
                movement
              ) =>
                String(
                  movement.productId
                )
            )

        );


      const openingMovements =
        [];


      currentProducts.forEach(
        (
          product
        ) => {

          const stock =
            numberValue(
              product.stock ??
              product.openingStock
            );


          if (
            stock <=
            0
          ) {
            return;
          }


          if (
            existingProductIds.has(
              String(
                product.id
              )
            )
          ) {
            return;
          }


          openingMovements.push({

            id:
              `OPEN-${product.id}-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 7)}`,

            productId:
              product.id,

            productName:
              product.name,

            productCode:
              product.code,

            category:
              product.category,

            brand:
              product.brand,

            unit:
              product.unit ||
              "Adet",

            type:
              "Açılış Stoku",

            quantity:
              stock,

            previousStock:
              0,

            newStock:
              stock,

            date:
              product.createdAt ||
              new Date()
                .toISOString(),

            source:
              "Yeni Stok",

            description:
              "Ürün oluşturulurken tanımlanan başlangıç stoğu.",

            user:
              "Sistem",

          });

        }
      );


      if (
        openingMovements.length
      ) {

        writeStorage(
          MOVEMENTS_KEY,
          [
            ...openingMovements,
            ...currentMovements,
          ]
        );


        window.dispatchEvent(
          new Event(
            "ren-stock-movements-changed"
          )
        );


        loadData();

      }

    };


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <div className="ren-stock-movements">


      {/* HEADER */}

      <header className="ren-stock-movements-header">

        <div>

          <div className="ren-breadcrumb">

            <span>
              Stok
            </span>

            <span>
              ›
            </span>

            <strong>
              Stok Hareketleri
            </strong>

          </div>


          <h1>
            Stok Hareketleri
          </h1>


          <p>
            Ürünlerin giriş, çıkış ve stok
            değişimlerini takip edin.
          </p>

        </div>


        <div className="ren-header-actions">

          <button
            type="button"
            className="ren-button secondary"
            onClick={
              loadData
            }
          >

            <MdRefresh />

            Yenile

          </button>


          <button
            type="button"
            className="ren-button secondary"
            onClick={
              createOpeningMovements
            }
          >

            <MdInventory2 />

            Açılış Stoklarını Kontrol Et

          </button>

        </div>

      </header>


      {/* SUMMARY */}

      <section className="ren-movement-summary">

        <div className="ren-movement-summary-card">

          <div className="summary-icon blue">
            <MdSwapVert />
          </div>

          <div>

            <span>
              Toplam Hareket
            </span>

            <strong>
              {
                summary.count
              }
            </strong>

            <small>
              Filtrelenen kayıt
            </small>

          </div>

        </div>


        <div className="ren-movement-summary-card">

          <div className="summary-icon green">
            <MdArrowUpward />
          </div>

          <div>

            <span>
              Toplam Giriş
            </span>

            <strong>
              +
              {
                formatNumber(
                  summary.totalIn
                )
              }
            </strong>

            <small>
              Stok artışı
            </small>

          </div>

        </div>


        <div className="ren-movement-summary-card">

          <div className="summary-icon red">
            <MdArrowDownward />
          </div>

          <div>

            <span>
              Toplam Çıkış
            </span>

            <strong>
              -
              {
                formatNumber(
                  summary.totalOut
                )
              }
            </strong>

            <small>
              Stok azalışı
            </small>

          </div>

        </div>


        <div className="ren-movement-summary-card">

          <div className="summary-icon orange">
            <MdTrendingUp />
          </div>

          <div>

            <span>
              Net Hareket
            </span>

            <strong
              className={
                summary.net >= 0
                  ? "green-text"
                  : "red-text"
              }
            >

              {
                summary.net >= 0
                  ? "+"
                  : ""
              }

              {
                formatNumber(
                  summary.net
                )
              }

            </strong>

            <small>
              Giriş - çıkış
            </small>

          </div>

        </div>

      </section>


      {/* SELECTED PRODUCT */}

      {
        selectedProductData && (

          <section className="ren-selected-product">

            <div className="ren-selected-product-icon">
              <MdInventory2 />
            </div>


            <div>

              <span>
                Seçili Ürün
              </span>

              <strong>
                {
                  selectedProductData.name
                }
              </strong>

              <small>
                Kod:
                {" "}
                {
                  selectedProductData.code ||
                  "-"
                }
              </small>

            </div>


            <div className="ren-selected-product-stock">

              <span>
                Güncel Stok
              </span>

              <strong>

                {
                  formatNumber(
                    selectedProductData.stock
                  )
                }

                {" "}

                {
                  selectedProductData.unit ||
                  "Adet"
                }

              </strong>

            </div>


            <button
              type="button"
              onClick={() => {

                setProductFilter(
                  ""
                );

                setSelectedProduct(
                  null
                );

              }}
            >

              <MdClose />

            </button>

          </section>

        )
      }


      {/* FILTERS */}

      <section className="ren-movement-filters">

        <div className="ren-stock-search">

          <MdSearch />


          <input
            type="text"
            value={
              search
            }
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Ürün, kod, kaynak veya açıklama ara..."
          />


          {
            search && (

              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
              >
                <MdClose />
              </button>

            )
          }

        </div>


        <div className="ren-filter-field">

          <MdInventory2 />


          <select
            value={
              productFilter
            }
            onChange={(event) =>
              handleProductChange(
                event.target.value
              )
            }
          >

            <option value="">
              Tüm Ürünler
            </option>


            {
              products.map(
                (
                  product
                ) => (

                  <option
                    key={
                      product.id
                    }
                    value={
                      product.id
                    }
                  >

                    {
                      product.name
                    }

                    {" - "}

                    {
                      product.code ||
                      "-"
                    }

                  </option>

                )
              )
            }

          </select>

        </div>


        <div className="ren-filter-field">

          <MdSwapVert />


          <select
            value={
              typeFilter
            }
            onChange={(event) =>
              setTypeFilter(
                event.target.value
              )
            }
          >

            <option value="all">
              Tüm Hareketler
            </option>

            <option value="in">
              Stok Girişleri
            </option>

            <option value="out">
              Stok Çıkışları
            </option>

            <option value="adjustment">
              Stok Düzeltmeleri
            </option>

          </select>

        </div>


        <div className="ren-filter-date">

          <MdCalendarToday />


          <input
            type="date"
            value={
              dateFilter
            }
            onChange={(event) =>
              setDateFilter(
                event.target.value
              )
            }
          />

        </div>


        <button
          type="button"
          className="ren-today-button"
          onClick={() =>
            setDateFilter(
              todayInput()
            )
          }
        >
          Bugün
        </button>


        {
          (
            search ||
            productFilter ||
            typeFilter !== "all" ||
            dateFilter
          ) && (

            <button
              type="button"
              className="ren-clear-filter"
              onClick={
                clearFilters
              }
            >

              <MdClose />

              Temizle

            </button>

          )
        }

      </section>


      {/* TABS */}

      <section className="ren-movement-tabs">

        <button
          type="button"
          className={
            typeFilter === "all"
              ? "active"
              : ""
          }
          onClick={() =>
            setTypeFilter(
              "all"
            )
          }
        >
          Tümü
        </button>


        <button
          type="button"
          className={
            typeFilter === "in"
              ? "active"
              : ""
          }
          onClick={() =>
            setTypeFilter(
              "in"
            )
          }
        >

          <MdArrowUpward />

          Girişler

        </button>


        <button
          type="button"
          className={
            typeFilter === "out"
              ? "active"
              : ""
          }
          onClick={() =>
            setTypeFilter(
              "out"
            )
          }
        >

          <MdArrowDownward />

          Çıkışlar

        </button>


        <button
          type="button"
          className={
            typeFilter === "adjustment"
              ? "active"
              : ""
          }
          onClick={() =>
            setTypeFilter(
              "adjustment"
            )
          }
        >

          <MdSwapVert />

          Düzeltmeler

        </button>

      </section>


      {/* TABLE */}

      <section className="ren-stock-movements-table-card">

        <div className="ren-table-topbar">

          <div>

            <strong>
              {
                filteredMovements.length
              }
            </strong>

            <span>
              hareket listeleniyor
            </span>

          </div>

        </div>


        <div className="ren-table-scroll">

          <table className="ren-stock-movements-table">

            <thead>

              <tr>

                <th>
                  Tarih / Saat
                </th>

                <th>
                  Ürün
                </th>

                <th>
                  İşlem
                </th>

                <th>
                  Önceki Stok
                </th>

                <th>
                  Hareket
                </th>

                <th>
                  Sonraki Stok
                </th>

                <th>
                  Kaynak
                </th>

                <th>
                  Açıklama
                </th>

                <th
                  style={{
                    width:
                      "115px",
                    textAlign:
                      "center",
                  }}
                >
                  İşlemler
                </th>

              </tr>

            </thead>


            <tbody>

              {
                loading ? (

                  <tr>

                    <td
                      colSpan="9"
                      className="ren-empty-table"
                    >
                      Veriler yükleniyor...
                    </td>

                  </tr>

                ) : filteredMovements.length ===
                  0 ? (

                  <tr>

                    <td
                      colSpan="9"
                      className="ren-empty-table"
                    >

                      <MdInventory2 />

                      <strong>
                        Stok hareketi bulunamadı
                      </strong>

                      <span>
                        Seçtiğiniz filtrelere uygun
                        bir hareket kaydı yok.
                      </span>

                    </td>

                  </tr>

                ) : (

                  filteredMovements.map(
                    (
                      movement
                    ) => (

                      <tr
                        key={
                          movement.id
                        }
                      >

                        <td>

                          <div className="ren-movement-date">

                            <strong>
                              {
                                formatDate(
                                  movement.date
                                )
                              }
                            </strong>

                          </div>

                        </td>


                        <td>

                          <div className="ren-movement-product">

                            <div className="ren-movement-product-icon">

                              <MdInventory2 />

                            </div>


                            <div>

                              <button
                                type="button"
                                onClick={() =>
                                  openProductDetail(
                                    movement.productId
                                  )
                                }
                                disabled={
                                  !movement.productId
                                }
                                style={{
                                  border: 0,
                                  background: "transparent",
                                  padding: 0,
                                  margin: 0,
                                  cursor:
                                    movement.productId
                                      ? "pointer"
                                      : "default",
                                  font: "inherit",
                                  fontWeight: 700,
                                  textAlign: "left",
                                }}
                                title={
                                  movement.productId
                                    ? "Ürün detayını aç"
                                    : "Ürün eşleşmesi bulunamadı"
                                }
                              >

                                {
                                  movement.productName
                                }

                              </button>


                              <span>
                                {
                                  movement.productCode
                                }
                              </span>

                            </div>

                          </div>

                        </td>


                        <td>

                          <span
                            className={
                              `ren-movement-badge ${movement.type}`
                            }
                          >

                            {
                              movement.type ===
                              "in" && (
                                <MdArrowUpward />
                              )
                            }


                            {
                              movement.type ===
                              "out" && (
                                <MdArrowDownward />
                              )
                            }


                            {
                              movement.type ===
                              "adjustment" && (
                                <MdSwapVert />
                              )
                            }


                            {
                              movement.typeLabel
                            }

                          </span>

                        </td>


                        <td>

                          <strong>
                            {
                              formatNumber(
                                movement.previousStock
                              )
                            }
                          </strong>

                          <small>
                            {" "}
                            {
                              movement.unit
                            }
                          </small>

                        </td>


                        <td>

                          <strong
                            className={
                              movement.type ===
                              "in"
                                ? "movement-positive"
                                : movement.type ===
                                  "out"
                                ? "movement-negative"
                                : "movement-neutral"
                            }
                          >

                            {
                              movement.type ===
                              "in"
                                ? "+"
                                : movement.type ===
                                  "out"
                                ? "-"
                                : movement.signedQuantity >=
                                  0
                                ? "+"
                                : ""
                            }

                            {
                              formatNumber(
                                movement.quantity
                              )
                            }

                          </strong>

                          <small>
                            {" "}
                            {
                              movement.unit
                            }
                          </small>

                        </td>


                        <td>

                          <strong className="new-stock-value">

                            {
                              formatNumber(
                                movement.newStock
                              )
                            }

                          </strong>

                          <small>
                            {" "}
                            {
                              movement.unit
                            }
                          </small>

                        </td>


                        <td>

                          <span className="ren-source">

                            {
                              movement.source
                            }

                          </span>

                        </td>


                        <td>

                          <span className="ren-movement-description">

                            {
                              movement.description
                            }

                          </span>

                        </td>


                        <td>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "4px",
                            }}
                          >

                            <button
                              type="button"
                              onClick={() =>
                                openMovementDetail(
                                  movement
                                )
                              }
                              style={{
                                border:
                                  "1px solid #dfe3e7",
                                background:
                                  "#fff",
                                borderRadius:
                                  "4px",
                                padding:
                                  "5px 7px",
                                cursor:
                                  "pointer",
                                fontSize:
                                  "10px",
                              }}
                            >
                              Detay
                            </button>


                            <button
                              type="button"
                              onClick={() =>
                                openMovementEdit(
                                  movement
                                )
                              }
                              style={{
                                border:
                                  "1px solid #dfe3e7",
                                background:
                                  "#fff",
                                borderRadius:
                                  "4px",
                                padding:
                                  "5px 7px",
                                cursor:
                                  "pointer",
                                fontSize:
                                  "10px",
                              }}
                            >
                              Düzenle
                            </button>


                            <button
                              type="button"
                              onClick={() =>
                                deleteMovement(
                                  movement
                                )
                              }
                              style={{
                                border:
                                  "1px solid #f1d1d1",
                                background:
                                  "#fff",
                                color:
                                  "#c54d49",
                                borderRadius:
                                  "4px",
                                padding:
                                  "5px 7px",
                                cursor:
                                  "pointer",
                                fontSize:
                                  "10px",
                              }}
                            >
                              Sil
                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  )

                )
              }

            </tbody>

          </table>

        </div>


        <div className="ren-table-footer">

          <span>

            Toplam{" "}

            <strong>
              {
                filteredMovements.length
              }
            </strong>

            {" "}
            kayıt

          </span>

        </div>

      </section>


      {/* =====================================================
          DETAY MODALI
      ===================================================== */}

      {
        selectedMovement && (

          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              background:
                "rgba(20,25,30,.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            }}
            onMouseDown={(event) => {

              if (
                event.target ===
                event.currentTarget
              ) {

                setSelectedMovement(
                  null
                );

              }

            }}
          >

            <div
              style={{
                width: "100%",
                maxWidth: "540px",
                background: "#fff",
                borderRadius: "8px",
                boxShadow:
                  "0 20px 60px rgba(0,0,0,.18)",
                overflow: "hidden",
              }}
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "flex-start",
                  padding:
                    "20px 22px",
                  borderBottom:
                    "1px solid #eee",
                }}
              >

                <div>

                  <div
                    style={{
                      fontSize:
                        "10px",
                      color:
                        "#8b939b",
                      fontWeight:
                        700,
                      marginBottom:
                        "5px",
                    }}
                  >
                    STOK HAREKETİ
                  </div>


                  <h2
                    style={{
                      margin: 0,
                      fontSize: "20px",
                      color:
                        "#2c333b",
                    }}
                  >
                    {
                      selectedMovement.productName
                    }
                  </h2>

                </div>


                <button
                  type="button"
                  onClick={() =>
                    setSelectedMovement(
                      null
                    )
                  }
                  style={{
                    border: 0,
                    background:
                      "#f3f4f5",
                    width: "32px",
                    height: "32px",
                    borderRadius:
                      "50%",
                    cursor:
                      "pointer",
                    fontSize:
                      "18px",
                  }}
                >
                  ×
                </button>

              </div>


              <div
                style={{
                  padding: "22px",
                }}
              >

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "1fr 1fr",
                    gap: "16px",
                  }}
                >

                  <div>
                    <small>
                      TARİH
                    </small>

                    <strong
                      style={{
                        display:
                          "block",
                        marginTop:
                          "5px",
                      }}
                    >
                      {
                        formatDate(
                          selectedMovement.date
                        )
                      }
                    </strong>
                  </div>


                  <div>
                    <small>
                      İŞLEM
                    </small>

                    <strong
                      style={{
                        display:
                          "block",
                        marginTop:
                          "5px",
                      }}
                    >
                      {
                        selectedMovement.typeLabel
                      }
                    </strong>
                  </div>


                  <div>
                    <small>
                      ÜRÜN KODU
                    </small>

                    <strong
                      style={{
                        display:
                          "block",
                        marginTop:
                          "5px",
                      }}
                    >
                      {
                        selectedMovement.productCode
                      }
                    </strong>
                  </div>


                  <div>
                    <small>
                      KAYNAK
                    </small>

                    <strong
                      style={{
                        display:
                          "block",
                        marginTop:
                          "5px",
                      }}
                    >
                      {
                        selectedMovement.source
                      }
                    </strong>
                  </div>


                  <div>
                    <small>
                      ÖNCEKİ STOK
                    </small>

                    <strong
                      style={{
                        display:
                          "block",
                        marginTop:
                          "5px",
                      }}
                    >
                      {
                        formatNumber(
                          selectedMovement.previousStock
                        )
                      }{" "}
                      {
                        selectedMovement.unit
                      }
                    </strong>
                  </div>


                  <div>
                    <small>
                      HAREKET
                    </small>

                    <strong
                      style={{
                        display:
                          "block",
                        marginTop:
                          "5px",
                        color:
                          selectedMovement.signedQuantity >=
                          0
                            ? "#3d8b63"
                            : "#c54d49",
                      }}
                    >

                      {
                        selectedMovement.signedQuantity >=
                        0
                          ? "+"
                          : ""
                      }

                      {
                        formatNumber(
                          selectedMovement.signedQuantity
                        )
                      }

                      {" "}

                      {
                        selectedMovement.unit
                      }

                    </strong>
                  </div>


                  <div>
                    <small>
                      SONRAKİ STOK
                    </small>

                    <strong
                      style={{
                        display:
                          "block",
                        marginTop:
                          "5px",
                      }}
                    >
                      {
                        formatNumber(
                          selectedMovement.newStock
                        )
                      }{" "}
                      {
                        selectedMovement.unit
                      }
                    </strong>
                  </div>


                  <div>
                    <small>
                      KULLANICI
                    </small>

                    <strong
                      style={{
                        display:
                          "block",
                        marginTop:
                          "5px",
                      }}
                    >
                      {
                        selectedMovement.user
                      }
                    </strong>
                  </div>


                  <div
                    style={{
                      gridColumn:
                        "1 / -1",
                    }}
                  >

                    <small>
                      AÇIKLAMA
                    </small>

                    <strong
                      style={{
                        display:
                          "block",
                        marginTop:
                          "5px",
                      }}
                    >
                      {
                        selectedMovement.description
                      }
                    </strong>

                  </div>

                </div>

              </div>


              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "flex-end",
                  gap: "8px",
                  padding:
                    "15px 22px",
                  borderTop:
                    "1px solid #eee",
                  background:
                    "#fafbfc",
                }}
              >

                <button
                  type="button"
                  onClick={() =>
                    setSelectedMovement(
                      null
                    )
                  }
                  style={{
                    border:
                      "1px solid #ddd",
                    background:
                      "#fff",
                    borderRadius:
                      "5px",
                    padding:
                      "9px 15px",
                    cursor:
                      "pointer",
                  }}
                >
                  Kapat
                </button>


                <button
                  type="button"
                  onClick={() =>
                    openMovementEdit(
                      selectedMovement
                    )
                  }
                  style={{
                    border: 0,
                    background:
                      "#57514d",
                    color: "#fff",
                    borderRadius:
                      "5px",
                    padding:
                      "9px 15px",
                    cursor:
                      "pointer",
                  }}
                >
                  Düzenle
                </button>


                <button
                  type="button"
                  onClick={() =>
                    deleteMovement(
                      selectedMovement
                    )
                  }
                  style={{
                    border: 0,
                    background:
                      "#c64c48",
                    color: "#fff",
                    borderRadius:
                      "5px",
                    padding:
                      "9px 15px",
                    cursor:
                      "pointer",
                  }}
                >
                  Sil
                </button>

              </div>

            </div>

          </div>

        )
      }


      {/* =====================================================
          DÜZENLE MODALI
      ===================================================== */}

      {
        editingMovement && (

          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10000,
              background:
                "rgba(20,25,30,.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            }}
            onMouseDown={(event) => {

              if (
                event.target ===
                event.currentTarget
              ) {

                cancelMovementEdit();

              }

            }}
          >

            <div
              style={{
                width: "100%",
                maxWidth: "560px",
                background: "#fff",
                borderRadius: "8px",
                boxShadow:
                  "0 20px 60px rgba(0,0,0,.18)",
                overflow: "hidden",
              }}
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "flex-start",
                  padding:
                    "20px 22px",
                  borderBottom:
                    "1px solid #eee",
                }}
              >

                <div>

                  <div
                    style={{
                      fontSize: "10px",
                      color:
                        "#8b939b",
                      fontWeight: 700,
                      marginBottom:
                        "5px",
                    }}
                  >
                    STOK HAREKETİNİ DÜZENLE
                  </div>


                  <h2
                    style={{
                      margin: 0,
                      fontSize:
                        "20px",
                      color:
                        "#2c333b",
                    }}
                  >
                    {
                      editingMovement.productName
                    }
                  </h2>

                </div>


                <button
                  type="button"
                  onClick={
                    cancelMovementEdit
                  }
                  style={{
                    border: 0,
                    background:
                      "#f3f4f5",
                    width: "32px",
                    height: "32px",
                    borderRadius:
                      "50%",
                    cursor:
                      "pointer",
                    fontSize:
                      "18px",
                  }}
                >
                  ×
                </button>

              </div>


              <div
                style={{
                  padding: "22px",
                }}
              >

                <div
                  style={{
                    marginBottom:
                      "15px",
                  }}
                >

                  <label
                    style={{
                      display:
                        "block",
                      fontSize:
                        "11px",
                      fontWeight:
                        700,
                      color:
                        "#666",
                      marginBottom:
                        "6px",
                    }}
                  >
                    Ürün
                  </label>


                  <select
                    value={
                      movementForm.productId
                    }
                    onChange={(event) =>
                      setMovementForm(
                        (
                          current
                        ) => ({
                          ...current,
                          productId:
                            event.target.value,
                        })
                      )
                    }
                    style={{
                      width:
                        "100%",
                      height:
                        "40px",
                      border:
                        "1px solid #ddd",
                      borderRadius:
                        "5px",
                      padding:
                        "0 10px",
                    }}
                  >

                    {
                      products.map(
                        (
                          product
                        ) => (

                          <option
                            key={
                              product.id
                            }
                            value={
                              product.id
                            }
                          >

                            {
                              product.name
                            }

                            {" — "}

                            {
                              product.code ||
                              "-"
                            }

                          </option>

                        )
                      )
                    }

                  </select>

                </div>


                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "1fr 1fr",
                    gap: "12px",
                    marginBottom:
                      "15px",
                  }}
                >

                  <div>

                    <label
                      style={{
                        display:
                          "block",
                        fontSize:
                          "11px",
                        fontWeight:
                          700,
                        color:
                          "#666",
                        marginBottom:
                          "6px",
                      }}
                    >
                      İşlem Türü
                    </label>


                    <select
                      value={
                        movementForm.type
                      }
                      onChange={(event) =>
                        setMovementForm(
                          (
                            current
                          ) => ({
                            ...current,
                            type:
                              event.target.value,
                          })
                        )
                      }
                      style={{
                        width:
                          "100%",
                        height:
                          "40px",
                        border:
                          "1px solid #ddd",
                        borderRadius:
                          "5px",
                        padding:
                          "0 10px",
                      }}
                    >

                      <option value="in">
                        Stok Girişi
                      </option>

                      <option value="out">
                        Stok Çıkışı
                      </option>

                    </select>

                  </div>


                  <div>

                    <label
                      style={{
                        display:
                          "block",
                        fontSize:
                          "11px",
                        fontWeight:
                          700,
                        color:
                          "#666",
                        marginBottom:
                          "6px",
                      }}
                    >
                      Miktar
                    </label>


                    <input
                      type="text"
                      inputMode="decimal"
                      value={
                        movementForm.quantity
                      }
                      onChange={(event) =>
                        setMovementForm(
                          (
                            current
                          ) => ({
                            ...current,
                            quantity:
                              event.target.value,
                          })
                        )
                      }
                      style={{
                        width:
                          "100%",
                        height:
                          "40px",
                        border:
                          "1px solid #ddd",
                        borderRadius:
                          "5px",
                        padding:
                          "0 10px",
                        boxSizing:
                          "border-box",
                      }}
                    />

                  </div>

                </div>


                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "1fr 1fr",
                    gap: "12px",
                    marginBottom:
                      "15px",
                  }}
                >

                  <div>

                    <label
                      style={{
                        display:
                          "block",
                        fontSize:
                          "11px",
                        fontWeight:
                          700,
                        color:
                          "#666",
                        marginBottom:
                          "6px",
                      }}
                    >
                      Tarih
                    </label>


                    <input
                      type="date"
                      value={
                        movementForm.date
                      }
                      onChange={(event) =>
                        setMovementForm(
                          (
                            current
                          ) => ({
                            ...current,
                            date:
                              event.target.value,
                          })
                        )
                      }
                      style={{
                        width:
                          "100%",
                        height:
                          "40px",
                        border:
                          "1px solid #ddd",
                        borderRadius:
                          "5px",
                        padding:
                          "0 10px",
                        boxSizing:
                          "border-box",
                      }}
                    />

                  </div>


                  <div>

                    <label
                      style={{
                        display:
                          "block",
                        fontSize:
                          "11px",
                        fontWeight:
                          700,
                        color:
                          "#666",
                        marginBottom:
                          "6px",
                      }}
                    >
                      Kaynak
                    </label>


                    <input
                      type="text"
                      value={
                        movementForm.source
                      }
                      onChange={(event) =>
                        setMovementForm(
                          (
                            current
                          ) => ({
                            ...current,
                            source:
                              event.target.value,
                          })
                        )
                      }
                      style={{
                        width:
                          "100%",
                        height:
                          "40px",
                        border:
                          "1px solid #ddd",
                        borderRadius:
                          "5px",
                        padding:
                          "0 10px",
                        boxSizing:
                          "border-box",
                      }}
                    />

                  </div>

                </div>


                <div>

                  <label
                    style={{
                      display:
                        "block",
                      fontSize:
                        "11px",
                      fontWeight:
                        700,
                      color:
                        "#666",
                      marginBottom:
                        "6px",
                    }}
                  >
                    Açıklama
                  </label>


                  <textarea
                    rows="3"
                    value={
                      movementForm.description
                    }
                    onChange={(event) =>
                      setMovementForm(
                        (
                          current
                        ) => ({
                          ...current,
                          description:
                            event.target.value,
                        })
                      )
                    }
                    style={{
                      width:
                        "100%",
                      border:
                        "1px solid #ddd",
                      borderRadius:
                        "5px",
                      padding:
                        "10px",
                      boxSizing:
                        "border-box",
                      resize:
                        "vertical",
                    }}
                  />

                </div>

              </div>


              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "flex-end",
                  gap: "8px",
                  padding:
                    "15px 22px",
                  borderTop:
                    "1px solid #eee",
                  background:
                    "#fafbfc",
                }}
              >

                <button
                  type="button"
                  onClick={
                    cancelMovementEdit
                  }
                  style={{
                    border:
                      "1px solid #ddd",
                    background:
                      "#fff",
                    borderRadius:
                      "5px",
                    padding:
                      "9px 15px",
                    cursor:
                      "pointer",
                  }}
                >
                  Vazgeç
                </button>


                <button
                  type="button"
                  onClick={
                    saveMovementEdit
                  }
                  style={{
                    border: 0,
                    background:
                      "#57514d",
                    color: "#fff",
                    borderRadius:
                      "5px",
                    padding:
                      "9px 15px",
                    cursor:
                      "pointer",
                    fontWeight:
                      700,
                  }}
                >
                  Değişiklikleri Kaydet
                </button>

              </div>

            </div>

          </div>

        )
      }


      {/* INFO */}

      <div className="ren-movement-info">

        <MdTrendingUp />

        <span>
          Stok hareketleri Yeni Stok,
          Stok Listesi ve Toplu İşlemler
          üzerinden yapılan değişikliklerle
          birlikte güncellenir.
        </span>

      </div>

    </div>

  );
}