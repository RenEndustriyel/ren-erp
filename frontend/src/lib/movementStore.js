const MOVEMENT_STORAGE_KEY =
  "ren-erp-customer-movements";

const COLLECTION_STORAGE_KEY =
  "ren-erp-collections";

const PAYMENT_STORAGE_KEY =
  "ren-erp-payments";

const INVOICE_STORAGE_KEY =
  "ren-erp-invoices";

const FINANCE_MOVEMENT_STORAGE_KEY =
  "ren-erp-cash-bank-movements";


/* =========================================================
   SAYI
========================================================= */

function numberValue(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

  let text =
    String(value).trim();

  if (
    text.includes(",") &&
    text.includes(".")
  ) {
    text = text
      .replace(/\./g, "")
      .replace(",", ".");
  } else if (
    text.includes(",")
  ) {
    text =
      text.replace(",", ".");
  }

  const result =
    Number(text);

  return Number.isFinite(
    result
  )
    ? result
    : 0;
}


/* =========================================================
   NORMAL CARİ HAREKETLER
========================================================= */

export function getCustomerMovements() {
  try {
    const saved =
      localStorage.getItem(
        MOVEMENT_STORAGE_KEY
      );

    if (!saved) {
      return [];
    }

    const parsed =
      JSON.parse(saved);

    return Array.isArray(parsed)
      ? parsed
      : [];

  } catch (error) {

    console.error(
      "REN ERP cari hareketleri okunamadı:",
      error
    );

    return [];
  }
}


export function saveCustomerMovements(
  movements
) {

  localStorage.setItem(
    MOVEMENT_STORAGE_KEY,
    JSON.stringify(
      movements
    )
  );

  window.dispatchEvent(
    new Event(
      "ren-customer-movements-updated"
    )
  );
}


export function addCustomerMovement(
  movement
) {

  const movements =
    getCustomerMovements();

  const updated = [
    movement,
    ...movements,
  ];

  saveCustomerMovements(
    updated
  );

  return updated;
}


export function deleteCustomerMovement(
  movementId
) {

  const movements =
    getCustomerMovements();

  const updated =
    movements.filter(
      (movement) =>
        String(
          movement.id
        ) !==
        String(
          movementId
        )
    );

  saveCustomerMovements(
    updated
  );

  return updated;
}


/* =========================================================
   ESKİ TAHSİLAT KAYITLARI
========================================================= */

export function getCollectionMovements() {

  try {

    const saved =
      localStorage.getItem(
        COLLECTION_STORAGE_KEY
      );

    if (!saved) {
      return [];
    }

    const collections =
      JSON.parse(saved);

    if (!Array.isArray(collections)) {
      return [];
    }

    return collections.map(
      (collection) => ({

        id:
          `collection-${collection.id}`,

        customerId:
          collection.customerId,

        customerName:
          collection.customerName,

        date:
          collection.date,

        document:
          collection.document ||
          `TAH-${collection.id}`,

        type:
          "Tahsilat",

        description:
          collection.description ||
          "Tahsilat",

        debt:
          0,

        credit:
          numberValue(
            collection.amount
          ),

        balance:
          null,

        method:
          collection.method,

        account:
          collection.account,

        source:
          "collection",

        sourceId:
          collection.id,

        invoiceId:
          collection.invoiceId ||
          null,

      })
    );

  } catch (error) {

    console.error(
      "REN ERP tahsilat hareketleri okunamadı:",
      error
    );

    return [];
  }
}


/* =========================================================
   ESKİ ÖDEME KAYITLARI
========================================================= */

export function getPaymentMovements() {

  try {

    const saved =
      localStorage.getItem(
        PAYMENT_STORAGE_KEY
      );

    if (!saved) {
      return [];
    }

    const payments =
      JSON.parse(saved);

    if (!Array.isArray(payments)) {
      return [];
    }

    return payments.map(
      (payment) => ({

        id:
          `payment-${payment.id}`,

        customerId:
          payment.customerId ||
          payment.supplierId,

        customerName:
          payment.customerName ||
          payment.supplierName,

        date:
          payment.date,

        document:
          payment.document ||
          `ODE-${payment.id}`,

        type:
          "Ödeme",

        description:
          payment.description ||
          "Ödeme",

        /*
         * Ödeme borcu azaltır.
         */
        debt:
          numberValue(
            payment.amount
          ),

        credit:
          0,

        balance:
          null,

        method:
          payment.method,

        account:
          payment.account,

        source:
          "payment",

        sourceId:
          payment.id,

        invoiceId:
          payment.invoiceId ||
          null,

      })
    );

  } catch (error) {

    console.error(
      "REN ERP ödeme hareketleri okunamadı:",
      error
    );

    return [];
  }
}


/* =========================================================
   KASA / BANKA / POS HAREKETLERİ
   Fatura detayından yapılan:
   - Tahsilat
   - Ödeme
   burada tutuluyor.
========================================================= */

function getFinanceCustomerMovements() {

  try {

    const saved =
      localStorage.getItem(
        FINANCE_MOVEMENT_STORAGE_KEY
      );

    if (!saved) {
      return [];
    }

    const financeMovements =
      JSON.parse(saved);

    if (
      !Array.isArray(
        financeMovements
      )
    ) {
      return [];
    }


    return financeMovements
      .filter(
        (movement) =>
          movement.source ===
            "collection" ||
          movement.source ===
            "payment"
      )
      .filter(
        (movement) =>
          movement.customerId
      )
      .map(
        (movement) => {

          const isPayment =
            movement.source ===
            "payment";


          return {

            id:
              `finance-${movement.id}`,

            customerId:
              movement.customerId,

            customerName:
              movement.customerName ||
              "",

            date:
              movement.date ||
              new Date(
                movement.createdAt ||
                Date.now()
              )
                .toISOString()
                .slice(
                  0,
                  10
                ),

            document:
              movement.sourceDocument ||
              movement.invoiceNo ||
              "—",

            type:
              isPayment
                ? "Ödeme"
                : "Tahsilat",

            description:
              movement.description ||
              (
                isPayment
                  ? "Tedarikçi ödemesi"
                  : "Müşteri tahsilatı"
              ),

            /*
             * Tahsilat:
             * borcu azaltır.
             *
             * Ödeme:
             * tedarikçiye olan borcu azaltır.
             *
             * Ortak bakiye hesabında
             * ikisi de borç/alacak
             * karşı hareketidir.
             */

            debt:
              isPayment
                ? numberValue(
                    movement.amount
                  )
                : 0,

            credit:
              isPayment
                ? 0
                : numberValue(
                    movement.amount
                  ),

            balance:
              null,

            method:
              movement.method,

            account:
              movement.accountName ||
              "",

            source:
              movement.source,

            sourceId:
              movement.id,

            invoiceId:
              movement.invoiceId ||
              movement.sourceId ||
              null,

            createdAt:
              movement.createdAt,

          };

        }
      );

  } catch (error) {

    console.error(
      "REN ERP finans cari hareketleri okunamadı:",
      error
    );

    return [];
  }
}


/* =========================================================
   FATURALAR
========================================================= */

function getInvoiceRecords() {

  try {

    const saved =
      localStorage.getItem(
        INVOICE_STORAGE_KEY
      );

    if (!saved) {
      return [];
    }

    const invoices =
      JSON.parse(saved);

    return Array.isArray(
      invoices
    )
      ? invoices
      : [];

  } catch (error) {

    console.error(
      "REN ERP faturaları okunamadı:",
      error
    );

    return [];
  }
}


function getInvoiceType(
  invoice
) {

  const value =
    String(
      invoice?.type ||
      ""
    )
      .trim()
      .toLowerCase();


  if (
    value ===
      "purchase" ||
    value ===
      "purchases" ||
    value ===
      "buy" ||
    value ===
      "alış" ||
    value ===
      "alis" ||
    value ===
      "alış faturası" ||
    value ===
      "alis faturasi"
  ) {
    return "purchase";
  }


  if (
    value ===
      "return" ||
    value ===
      "returns" ||
    value ===
      "iade"
  ) {
    return "return";
  }


  return "sales";
}


/* =========================================================
   FATURA HAREKETLERİ
========================================================= */

function createInvoiceMovements() {

  const invoices =
    getInvoiceRecords();

  const result = [];


  invoices.forEach(
    (invoice) => {

      if (
        !invoice.customerId
      ) {
        return;
      }


      const total =
        numberValue(
          invoice.total
        );


      if (
        total <= 0
      ) {
        return;
      }


      const type =
        getInvoiceType(
          invoice
        );


      /*
       * SATIŞ
       */

      if (
        type ===
        "sales"
      ) {

        result.push({

          id:
            `invoice-sale-${invoice.id}`,

          customerId:
            invoice.customerId,

          customerName:
            invoice.customerName ||
            "",

          date:
            invoice.date,

          document:
            invoice.invoiceNo ||
            `SAT-${invoice.id}`,

          type:
            "Satış",

          description:
            "Satış faturası",

          debt:
            total,

          credit:
            0,

          balance:
            null,

          method:
            invoice.paymentMethod,

          source:
            "invoice",

          sourceId:
            invoice.id,

          invoiceId:
            invoice.id,

        });

        return;
      }


      /*
       * ALIŞ
       *
       * Tedarikçiye borç.
       */

      if (
        type ===
        "purchase"
      ) {

        result.push({

          id:
            `invoice-purchase-${invoice.id}`,

          customerId:
            invoice.customerId,

          customerName:
            invoice.customerName ||
            invoice.supplierName ||
            "",

          date:
            invoice.date,

          document:
            invoice.invoiceNo ||
            `ALS-${invoice.id}`,

          type:
            "Alış",

          description:
            "Alış faturası",

          debt:
            0,

          credit:
            total,

          balance:
            null,

          method:
            invoice.paymentMethod,

          source:
            "invoice",

          sourceId:
            invoice.id,

          invoiceId:
            invoice.id,

        });

        return;
      }


      /*
       * İADE
       */

      if (
        type ===
        "return"
      ) {

        result.push({

          id:
            `invoice-return-${invoice.id}`,

          customerId:
            invoice.customerId,

          customerName:
            invoice.customerName ||
            "",

          date:
            invoice.date,

          document:
            invoice.invoiceNo ||
            `IADE-${invoice.id}`,

          type:
            "İade",

          description:
            "İade faturası",

          debt:
            0,

          credit:
            total,

          balance:
            null,

          source:
            "invoice",

          sourceId:
            invoice.id,

          invoiceId:
            invoice.id,

        });

      }

    }
  );


  return result;
}


/* =========================================================
   HAREKETLERDE ÇİFT KAYIT TEMİZLEME
========================================================= */

function uniqueMovements(
  movements
) {

  const seen =
    new Set();

  const result = [];


  movements.forEach(
    (movement) => {

      /*
       * Öncelikli benzersiz kimlik.
       */

      const key =
        movement.id
          ? String(
              movement.id
            )
          : [
              movement.source ||
                "",
              movement.sourceId ||
                "",
              movement.invoiceId ||
                "",
              movement.customerId ||
                "",
              movement.date ||
                "",
              movement.type ||
                "",
              movement.amount ||
                movement.debt ||
                movement.credit ||
                0,
            ].join("|");


      if (
        seen.has(
          key
        )
      ) {
        return;
      }


      seen.add(
        key
      );


      result.push(
        movement
      );

    }
  );


  return result;
}


/* =========================================================
   TÜM CARİ HAREKETLER
========================================================= */

export function getAllCustomerMovements() {

  const invoiceMovements =
    createInvoiceMovements();


  const manualMovements =
    getCustomerMovements();


  const collectionMovements =
    getCollectionMovements();


  const paymentMovements =
    getPaymentMovements();


  const financeMovements =
    getFinanceCustomerMovements();


  /*
   * Burada özellikle finans hareketlerini
   * dahil ediyoruz.
   *
   * Çünkü fatura detayındaki
   * + TAHSİLAT EKLE / + ÖDEME EKLE
   * işlemleri buraya yazılıyor.
   */

  const combined = [
    ...invoiceMovements,
    ...manualMovements,
    ...collectionMovements,
    ...paymentMovements,
    ...financeMovements,
  ];


  const unique =
    uniqueMovements(
      combined
    );


  return unique.sort(
    (a, b) => {

      const dateCompare =
        String(
          a.date ||
          ""
        ).localeCompare(
          String(
            b.date ||
            ""
          )
        );


      if (
        dateCompare !==
        0
      ) {
        return dateCompare;
      }


      return String(
        a.createdAt ||
        ""
      ).localeCompare(
        String(
          b.createdAt ||
          ""
        )
      );

    }
  );

}


/* =========================================================
   TEK CARİ
========================================================= */

export function getCustomerMovementsByCustomerId(
  customerId
) {

  return getAllCustomerMovements()
    .filter(
      (movement) =>
        String(
          movement.customerId
        ) ===
        String(
          customerId
        )
    );

}


/* =========================================================
   CARİ BAKİYE
========================================================= */

export function calculateCustomerBalance(
  customerId
) {

  const movements =
    getCustomerMovementsByCustomerId(
      customerId
    );


  let balance =
    0;


  movements.forEach(
    (movement) => {

      const debt =
        numberValue(
          movement.debt
        );

      const credit =
        numberValue(
          movement.credit
        );


      /*
       * Borç  -> negatif
       * Alacak -> pozitif
       */

      balance =
        balance -
        debt +
        credit;

    }
  );


  return balance;

}


/* =========================================================
   BAKİYE SIRALI HAREKETLER
========================================================= */

export function getCustomerMovementsWithBalance(
  customerId
) {

  const movements =
    getCustomerMovementsByCustomerId(
      customerId
    )
      .slice()
      .sort(
        (a, b) => {

          const dateCompare =
            String(
              a.date ||
              ""
            ).localeCompare(
              String(
                b.date ||
                ""
              )
            );


          if (
            dateCompare !==
            0
          ) {
            return dateCompare;
          }


          return String(
            a.createdAt ||
            ""
          ).localeCompare(
            String(
              b.createdAt ||
              ""
            )
          );

        }
      );


  let balance =
    0;


  return movements.map(
    (movement) => {

      const debt =
        numberValue(
          movement.debt
        );

      const credit =
        numberValue(
          movement.credit
        );


      balance =
        balance -
        debt +
        credit;


      return {
        ...movement,
        balance,
      };

    }
  );

}