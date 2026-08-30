import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "./CustomerTransfer.css";


const TRANSFER_KEY =
  "ren-customer-transfers";

const CUSTOMER_KEY =
  "ren-customers";


/* =========================================================
   YARDIMCI
========================================================= */

function readTransfers() {
  try {
    const raw =
      localStorage.getItem(
        TRANSFER_KEY
      );

    if (!raw) {
      return [];
    }

    const parsed =
      JSON.parse(
        raw
      );

    return Array.isArray(
      parsed
    )
      ? parsed
      : [];
  } catch {
    return [];
  }
}


function saveTransfers(
  transfers
) {
  localStorage.setItem(
    TRANSFER_KEY,
    JSON.stringify(
      transfers
    )
  );

  window.dispatchEvent(
    new Event(
      "ren-customer-transfers-updated"
    )
  );
}


function readCustomers() {
  try {
    const raw =
      localStorage.getItem(
        CUSTOMER_KEY
      );

    if (!raw) {
      return [];
    }

    const parsed =
      JSON.parse(
        raw
      );

    return Array.isArray(
      parsed
    )
      ? parsed
      : [];
  } catch {
    return [];
  }
}


function saveCustomers(
  customers
) {
  localStorage.setItem(
    CUSTOMER_KEY,
    JSON.stringify(
      customers
    )
  );

  window.dispatchEvent(
    new Event(
      "ren-customers-updated"
    )
  );
}


function money(value) {
  return new Intl.NumberFormat(
    "tr-TR",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(
    Number(value) || 0
  );
}


function numberValue(value) {
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
    )
      .trim()
      .replace(
        /\s/g,
        ""
      );

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
  } else {
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


function today() {
  const date =
    new Date();

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const year =
    date.getFullYear();

  return `${day}.${month}.${year}`;
}


function nextTransferNumber(
  transfers
) {
  let max =
    0;

  transfers.forEach(
    (
      transfer
    ) => {

      const value =
        String(
          transfer.document ||
          ""
        );

      const match =
        value.match(
          /^VRM-\d{4}-(\d+)$/i
        );

      if (!match) {
        return;
      }

      const sequence =
        Number(
          match[1]
        );

      if (
        Number.isFinite(
          sequence
        ) &&
        sequence >
        max
      ) {
        max =
          sequence;
      }
    }
  );

  return `VRM-${new Date().getFullYear()}-${String(
    max + 1
  ).padStart(
    4,
    "0"
  )}`;
}


/* =========================================================
   CARİ BAKİYESİNE VİRMAN ETKİSİ
========================================================= */

function applyTransferToCustomers(
  customers,
  transfer,
  reverse = false
) {
  const amount =
    numberValue(
      transfer.amount
    );

  if (
    amount <=
    0
  ) {
    return customers;
  }

  const sourceId =
    String(
      transfer.sourceCustomerId ||
      transfer.sourceId ||
      ""
    );

  const targetId =
    String(
      transfer.targetCustomerId ||
      transfer.targetId ||
      ""
    );

  if (
    !sourceId ||
    !targetId
  ) {
    return customers;
  }

  /*
    Normal:
    Kaynak - tutar
    Hedef  + tutar

    Reverse:
    Kaynak + tutar
    Hedef  - tutar
  */

  const factor =
    reverse
      ? -1
      : 1;

  return customers.map(
    (
      customer
    ) => {

      const id =
        String(
          customer.id
        );

      if (
        id !==
          sourceId &&
        id !==
          targetId
      ) {
        return customer;
      }

      let balance =
        numberValue(
          customer.balance
        );

      if (
        id ===
        sourceId
      ) {
        balance -=
          amount *
          factor;
      }

      if (
        id ===
        targetId
      ) {
        balance +=
          amount *
          factor;
      }

      return {
        ...customer,
        balance,
        updatedAt:
          new Date().toISOString(),
      };
    }
  );
}


/* =========================================================
   COMPONENT
========================================================= */

export default function CustomerTransfer() {

  const [
    customers,
    setCustomers,
  ] = useState(
    readCustomers
  );


  const [
    transfers,
    setTransfers,
  ] = useState(
    readTransfers
  );


  const [
    source,
    setSource,
  ] = useState(
    ""
  );


  const [
    target,
    setTarget,
  ] = useState(
    ""
  );


  const [
    date,
    setDate,
  ] = useState(
    today()
  );


  const [
    amount,
    setAmount,
  ] = useState(
    ""
  );


  const [
    description,
    setDescription,
  ] = useState(
    ""
  );


  const [
    search,
    setSearch,
  ] = useState(
    ""
  );


  const [
    activeMenu,
    setActiveMenu,
  ] = useState(
    null
  );


  const [
    editingTransfer,
    setEditingTransfer,
  ] = useState(
    null
  );


  const [
    detailTransferData,
    setDetailTransferData,
  ] = useState(
    null
  );


  const [
    showForm,
    setShowForm,
  ] = useState(
    false
  );


  /* =======================================================
     YENİLE
  ======================================================= */

  const refresh =
    () => {

      setCustomers(
        readCustomers()
      );

      setTransfers(
        readTransfers()
      );

    };


  useEffect(() => {

    refresh();

    const events = [
      "ren-customer-transfers-updated",
      "ren-customers-updated",
      "storage",
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

  const filteredTransfers =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLocaleLowerCase(
            "tr-TR"
          );


      if (!query) {
        return transfers;
      }


      return transfers.filter(
        (
          item
        ) => {

          return (

            String(
              item.document ||
              ""
            )
              .toLocaleLowerCase(
                "tr-TR"
              )
              .includes(
                query
              ) ||

            String(
              item.source ||
              item.sourceCustomerName ||
              ""
            )
              .toLocaleLowerCase(
                "tr-TR"
              )
              .includes(
                query
              ) ||

            String(
              item.target ||
              item.targetCustomerName ||
              ""
            )
              .toLocaleLowerCase(
                "tr-TR"
              )
              .includes(
                query
              ) ||

            String(
              item.description ||
              ""
            )
              .toLocaleLowerCase(
                "tr-TR"
              )
              .includes(
                query
              )

          );

        }
      );

    }, [
      transfers,
      search,
    ]);


  const selectedSource =
    customers.find(
      (
        item
      ) =>
        String(
          item.id
        ) ===
        String(
          source
        )
    );


  const selectedTarget =
    customers.find(
      (
        item
      ) =>
        String(
          item.id
        ) ===
        String(
          target
        )
    );


  /* =======================================================
     FORM TEMİZLE
  ======================================================= */

  const clearForm =
    () => {

      setSource(
        ""
      );

      setTarget(
        ""
      );

      setDate(
        today()
      );

      setAmount(
        ""
      );

      setDescription(
        ""
      );

      setEditingTransfer(
        null
      );

      setShowForm(
        false
      );

    };


  /* =======================================================
     FORM DOLDUR
  ======================================================= */

  const loadTransferToForm =
    (
      transfer
    ) => {

      const sourceId =
        transfer.sourceCustomerId ||
        transfer.sourceId ||
        customers.find(
          (
            customer
          ) =>
            customer.name ===
            transfer.source
        )?.id ||
        "";


      const targetId =
        transfer.targetCustomerId ||
        transfer.targetId ||
        customers.find(
          (
            customer
          ) =>
            customer.name ===
            transfer.target
        )?.id ||
        "";


      setSource(
        String(
          sourceId
        )
      );

      setTarget(
        String(
          targetId
        )
      );

      setDate(
        transfer.date ||
        today()
      );

      setAmount(
        transfer.amount ??
        ""
      );

      setDescription(
        transfer.description ||
        ""
      );

      setEditingTransfer(
        transfer
      );

      setShowForm(
        true
      );

      setActiveMenu(
        null
      );

      setDetailTransferData(
        null
      );

    };


  /* =======================================================
     KAYDET
  ======================================================= */

  const saveTransfer =
    () => {

      if (
        !source ||
        !target
      ) {

        alert(
          "Lütfen kaynak ve hedef cari hesapları seçin."
        );

        return;

      }


      if (
        String(
          source
        ) ===
        String(
          target
        )
      ) {

        alert(
          "Kaynak ve hedef cari aynı olamaz."
        );

        return;

      }


      const numericAmount =
        numberValue(
          amount
        );


      if (
        numericAmount <=
        0
      ) {

        alert(
          "Lütfen geçerli bir virman tutarı girin."
        );

        return;

      }


      const sourceCustomer =
        customers.find(
          (
            customer
          ) =>
            String(
              customer.id
            ) ===
            String(
              source
            )
        );


      const targetCustomer =
        customers.find(
          (
            customer
          ) =>
            String(
              customer.id
            ) ===
            String(
              target
            )
        );


      if (
        !sourceCustomer ||
        !targetCustomer
      ) {

        alert(
          "Kaynak veya hedef cari bulunamadı."
        );

        return;

      }


      /* =================================================
         DÜZENLE
      ================================================= */

      if (
        editingTransfer
      ) {

        /*
          Önce eski virmanın cari etkisini
          tamamen geri alıyoruz.
        */

        let updatedCustomers =
          applyTransferToCustomers(
            customers,
            editingTransfer,
            true
          );


        const updatedTransfer = {

          ...editingTransfer,

          date,

          sourceCustomerId:
            sourceCustomer.id,

          sourceCustomerName:
            sourceCustomer.name,

          source:
            sourceCustomer.name,

          targetCustomerId:
            targetCustomer.id,

          targetCustomerName:
            targetCustomer.name,

          target:
            targetCustomer.name,

          amount:
            numericAmount,

          description:
            description.trim() ||
            "Cari virman",

          updatedAt:
            new Date()
              .toISOString(),

        };


        /*
          Yeni virmanı uygula.
        */

        updatedCustomers =
          applyTransferToCustomers(
            updatedCustomers,
            updatedTransfer,
            false
          );


        const updatedTransfers =
          transfers.map(
            (
              item
            ) =>
              String(
                item.id
              ) ===
              String(
                editingTransfer.id
              )
                ? updatedTransfer
                : item
          );


        saveCustomers(
          updatedCustomers
        );

        saveTransfers(
          updatedTransfers
        );


        setCustomers(
          updatedCustomers
        );

        setTransfers(
          updatedTransfers
        );


        clearForm();


        alert(
          `${updatedTransfer.document} numaralı virman güncellendi.`
        );


        return;

      }


      /* =================================================
         YENİ
      ================================================= */

      const newTransfer = {

        id:
          `TR-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,

        date,

        document:
          nextTransferNumber(
            transfers
          ),

        sourceCustomerId:
          sourceCustomer.id,

        sourceCustomerName:
          sourceCustomer.name,

        source:
          sourceCustomer.name,

        targetCustomerId:
          targetCustomer.id,

        targetCustomerName:
          targetCustomer.name,

        target:
          targetCustomer.name,

        amount:
          numericAmount,

        description:
          description.trim() ||
          "Cari virman",

        sourceType:
          "customer-transfer",

        createdAt:
          new Date()
            .toISOString(),

      };


      const updatedCustomers =
        applyTransferToCustomers(
          customers,
          newTransfer,
          false
        );


      const updatedTransfers = [
        newTransfer,
        ...transfers,
      ];


      saveCustomers(
        updatedCustomers
      );

      saveTransfers(
        updatedTransfers
      );


      setCustomers(
        updatedCustomers
      );

      setTransfers(
        updatedTransfers
      );


      clearForm();


      alert(
        `${newTransfer.document} numaralı cari virman kaydedildi.`
      );

    };


  /* =======================================================
     DETAY
  ======================================================= */

  const detailTransfer =
    (
      transfer
    ) => {

      setDetailTransferData(
        transfer
      );

      setActiveMenu(
        null
      );

    };


  /* =======================================================
     SİL
  ======================================================= */

  const deleteTransfer =
    (
      transfer
    ) => {

      const confirmed =
        window.confirm(
          `"${transfer.document}" virmanını silmek istediğinize emin misiniz?\n\n` +
          `${transfer.source || transfer.sourceCustomerName} → ` +
          `${transfer.target || transfer.targetCustomerName}\n` +
          `${money(
            transfer.amount
          )} TL`
        );


      if (
        !confirmed
      ) {

        setActiveMenu(
          null
        );

        return;

      }


      /*
        Önce cari etkisini geri al.
      */

      const updatedCustomers =
        applyTransferToCustomers(
          customers,
          transfer,
          true
        );


      const updatedTransfers =
        transfers.filter(
          (
            item
          ) =>
            String(
              item.id
            ) !==
            String(
              transfer.id
            )
        );


      saveCustomers(
        updatedCustomers
      );

      saveTransfers(
        updatedTransfers
      );


      setCustomers(
        updatedCustomers
      );

      setTransfers(
        updatedTransfers
      );


      setActiveMenu(
        null
      );


      setDetailTransferData(
        null
      );


      alert(
        `${transfer.document} numaralı virman silindi.`
      );

    };


  /* =======================================================
     EXPORT EXCEL
  ======================================================= */

  const exportExcel =
    () => {

      const headers = [
        "Tarih",
        "Belge No",
        "Kaynak Cari",
        "Hedef Cari",
        "Tutar",
        "Açıklama",
      ];


      const rows =
        filteredTransfers.map(
          (
            item
          ) => [

            item.date,

            item.document,

            item.source ||
            item.sourceCustomerName ||
            "",

            item.target ||
            item.targetCustomerName ||
            "",

            item.amount,

            item.description ||
            "",

          ]
        );


      const csv = [
        headers.join(";"),

        ...rows.map(
          (
            row
          ) =>
            row
              .map(
                (
                  value
                ) =>
                  `"${String(
                    value ??
                    ""
                  ).replace(
                    /"/g,
                    '""'
                  )}"`
              )
              .join(";")
        ),

      ].join("\n");


      const blob =
        new Blob(
          [
            "\ufeff" +
            csv,
          ],
          {
            type:
              "text/csv;charset=utf-8;",
          }
        );


      const url =
        URL.createObjectURL(
          blob
        );


      const link =
        document.createElement(
          "a"
        );


      link.href =
        url;


      link.download =
        "REN-ERP-Cari-Virmanlar.csv";


      document.body.appendChild(
        link
      );


      link.click();


      document.body.removeChild(
        link
      );


      URL.revokeObjectURL(
        url
      );


      setActiveMenu(
        null
      );

    };


  /* =======================================================
     PDF
  ======================================================= */

  const exportPdf =
    () => {

      window.print();

      setActiveMenu(
        null
      );

    };


  return (

    <div
      className="customer-transfer-page"
      onClick={() =>
        setActiveMenu(
          null
        )
      }
    >

      <div className="customer-transfer-container">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="customer-transfer-header">

          <div>

            <div className="customer-transfer-breadcrumb">

              Müşteri - Tedarikçi

              <span>
                /
              </span>

              Cari Virman

            </div>


            <h1>
              Cari Virman
            </h1>


            <p>
              Bir cari hesaptan diğer cari hesaba
              bakiye aktarımı yapın.
            </p>

          </div>


          <div className="customer-transfer-header-actions">

            <button
              className="transfer-header-button"
              type="button"
              onClick={(event) => {

                event.stopPropagation();

                exportPdf();

              }}
            >
              PDF
            </button>


            <button
              className="transfer-header-button"
              type="button"
              onClick={(event) => {

                event.stopPropagation();

                exportExcel();

              }}
            >
              Excel
            </button>

          </div>

        </div>


        {/* =================================================
            VİRMAN FORMU
        ================================================= */}

        <div className="customer-transfer-form-card">

          <div className="transfer-card-title">

            <div>

              <strong>
                {
                  editingTransfer
                    ? "Cari Virmanı Düzenle"
                    : "Yeni Cari Virman"
                }
              </strong>

              <span>
                Kaynak ve hedef cari hesapları
                seçerek aktarım oluşturun.
              </span>

            </div>

          </div>


          <div className="transfer-form-grid">

            <div className="transfer-field">

              <label>
                Kaynak Cari
              </label>

              <select
                value={
                  source
                }
                onChange={(event) =>
                  setSource(
                    event.target.value
                  )
                }
              >

                <option value="">
                  Cari hesap seçin
                </option>


                {
                  customers.map(
                    (
                      customer
                    ) => (

                      <option
                        key={
                          customer.id
                        }
                        value={
                          customer.id
                        }
                      >

                        {
                          customer.name ||
                          customer.title ||
                          customer.companyName
                        }

                        {" — "}

                        {
                          customer.code ||
                          ""
                        }

                      </option>

                    )
                  )
                }

              </select>

            </div>


            <div className="transfer-arrow">
              →
            </div>


            <div className="transfer-field">

              <label>
                Hedef Cari
              </label>

              <select
                value={
                  target
                }
                onChange={(event) =>
                  setTarget(
                    event.target.value
                  )
                }
              >

                <option value="">
                  Cari hesap seçin
                </option>


                {
                  customers.map(
                    (
                      customer
                    ) => (

                      <option
                        key={
                          customer.id
                        }
                        value={
                          customer.id
                        }
                      >

                        {
                          customer.name ||
                          customer.title ||
                          customer.companyName
                        }

                        {" — "}

                        {
                          customer.code ||
                          ""
                        }

                      </option>

                    )
                  )
                }

              </select>

            </div>


            <div className="transfer-field">

              <label>
                Tarih
              </label>

              <input
                value={
                  date
                }
                onChange={(event) =>
                  setDate(
                    event.target.value
                  )
                }
                placeholder="GG.AA.YYYY"
              />

            </div>


            <div className="transfer-field">

              <label>
                Tutar
              </label>

              <div className="transfer-amount-input">

                <input
                  value={
                    amount
                  }
                  onChange={(event) =>
                    setAmount(
                      event.target.value
                    )
                  }
                  placeholder="0,00"
                  inputMode="decimal"
                />

                <span>
                  TL
                </span>

              </div>

            </div>


            <div className="transfer-field transfer-description">

              <label>
                Açıklama
              </label>

              <input
                value={
                  description
                }
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                placeholder="Virman açıklaması..."
              />

            </div>

          </div>


          <div className="transfer-form-footer">

            <button
              type="button"
              className="transfer-cancel"
              onClick={
                clearForm
              }
            >
              {
                editingTransfer
                  ? "İptal"
                  : "Temizle"
              }
            </button>


            <button
              type="button"
              className="transfer-save"
              onClick={
                saveTransfer
              }
            >
              {
                editingTransfer
                  ? "Değişiklikleri Kaydet"
                  : "Virmanı Kaydet"
              }
            </button>

          </div>

        </div>


        {/* =================================================
            GEÇMİŞ
        ================================================= */}

        <div className="customer-transfer-list-card">

          <div className="transfer-list-header">

            <div>

              <strong>
                Cari Virmanları
              </strong>

              <span>
                Gerçekleşen cari hesap aktarımları
              </span>

            </div>


            <div className="transfer-list-tools">

              <div className="transfer-search">

                <span>
                  ⌕
                </span>

                <input
                  value={
                    search
                  }
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Virman ara..."
                />

              </div>


              <button
                className="transfer-tool-button"
                type="button"
                onClick={
                  exportExcel
                }
              >
                Excel
              </button>


              <button
                className="transfer-tool-button"
                type="button"
                onClick={
                  exportPdf
                }
              >
                PDF
              </button>

            </div>

          </div>


          <div className="transfer-table-wrapper">

            <table className="customer-transfer-table">

              <thead>

                <tr>

                  <th>
                    TARİH
                  </th>

                  <th>
                    BELGE NO
                  </th>

                  <th>
                    KAYNAK CARİ
                  </th>

                  <th>
                    HEDEF CARİ
                  </th>

                  <th className="transfer-money-head">
                    TUTAR
                  </th>

                  <th>
                    AÇIKLAMA
                  </th>

                  <th className="transfer-actions-head">
                    İŞLEMLER
                  </th>

                </tr>

              </thead>


              <tbody>

                {
                  filteredTransfers.length ===
                  0 ? (

                    <tr>

                      <td
                        colSpan="7"
                        className="transfer-empty"
                      >

                        <div>
                          ⌕
                        </div>

                        <strong>
                          Virman bulunamadı
                        </strong>

                        <span>
                          Arama kriterlerini
                          değiştirerek tekrar deneyin.
                        </span>

                      </td>

                    </tr>

                  ) : (

                    filteredTransfers.map(
                      (
                        transfer
                      ) => (

                        <tr
                          key={
                            transfer.id
                          }
                        >

                          <td>
                            {
                              transfer.date
                            }
                          </td>


                          <td>

                            <button
                              type="button"
                              className="transfer-document-button"
                              onClick={(event) => {

                                event.stopPropagation();

                                detailTransfer(
                                  transfer
                                );

                              }}
                            >

                              {
                                transfer.document
                              }

                            </button>

                          </td>


                          <td>

                            <button
                              type="button"
                              className="transfer-party transfer-party-button"
                              onClick={(event) => {

                                event.stopPropagation();

                                const customer =
                                  customers.find(
                                    (
                                      item
                                    ) =>
                                      String(
                                        item.id
                                      ) ===
                                      String(
                                        transfer.sourceCustomerId ||
                                        transfer.sourceId
                                      )
                                  );

                                if (
                                  customer
                                ) {

                                  window.location.href =
                                    `/customers/detail?id=${encodeURIComponent(
                                      customer.id
                                    )}`;

                                }

                              }}
                            >

                              <span className="transfer-party-icon">

                                {
                                  (
                                    transfer.source ||
                                    transfer.sourceCustomerName ||
                                    "?"
                                  )
                                    .charAt(
                                      0
                                    )
                                    .toUpperCase()
                                }

                              </span>


                              <strong>
                                {
                                  transfer.source ||
                                  transfer.sourceCustomerName ||
                                  "—"
                                }
                              </strong>

                            </button>

                          </td>


                          <td>

                            <button
                              type="button"
                              className="transfer-party transfer-party-button"
                              onClick={(event) => {

                                event.stopPropagation();

                                const customer =
                                  customers.find(
                                    (
                                      item
                                    ) =>
                                      String(
                                        item.id
                                      ) ===
                                      String(
                                        transfer.targetCustomerId ||
                                        transfer.targetId
                                      )
                                  );

                                if (
                                  customer
                                ) {

                                  window.location.href =
                                    `/customers/detail?id=${encodeURIComponent(
                                      customer.id
                                    )}`;

                                }

                              }}
                            >

                              <span className="transfer-party-icon target">

                                {
                                  (
                                    transfer.target ||
                                    transfer.targetCustomerName ||
                                    "?"
                                  )
                                    .charAt(
                                      0
                                    )
                                    .toUpperCase()
                                }

                              </span>


                              <strong>
                                {
                                  transfer.target ||
                                  transfer.targetCustomerName ||
                                  "—"
                                }
                              </strong>

                            </button>

                          </td>


                          <td className="transfer-money">

                            {
                              money(
                                transfer.amount
                              )
                            } TL

                          </td>


                          <td>

                            {
                              transfer.description ||
                              "—"
                            }

                          </td>


                          <td className="transfer-actions">

                            <div className="transfer-action-wrapper">

                              <button
                                type="button"
                                className="transfer-more"
                                onClick={(event) => {

                                  event.stopPropagation();

                                  setActiveMenu(
                                    activeMenu ===
                                    transfer.id
                                      ? null
                                      : transfer.id
                                  );

                                }}
                              >
                                ⋮
                              </button>


                              {
                                activeMenu ===
                                transfer.id && (

                                  <div
                                    className="transfer-row-menu"
                                    onClick={(event) =>
                                      event.stopPropagation()
                                    }
                                  >

                                    <button
                                      type="button"
                                      onClick={() =>
                                        detailTransfer(
                                          transfer
                                        )
                                      }
                                    >

                                      <span>
                                        ↗
                                      </span>

                                      Detay

                                    </button>


                                    <button
                                      type="button"
                                      onClick={() =>
                                        loadTransferToForm(
                                          transfer
                                        )
                                      }
                                    >

                                      <span>
                                        ✎
                                      </span>

                                      Düzenle

                                    </button>


                                    <div className="transfer-menu-divider" />


                                    <button
                                      type="button"
                                      onClick={
                                        exportPdf
                                      }
                                    >

                                      <span>
                                        ▣
                                      </span>

                                      PDF

                                    </button>


                                    <button
                                      type="button"
                                      onClick={
                                        exportExcel
                                      }
                                    >

                                      <span>
                                        ▤
                                      </span>

                                      Excel

                                    </button>


                                    <div className="transfer-menu-divider" />


                                    <button
                                      type="button"
                                      className="transfer-delete"
                                      onClick={() =>
                                        deleteTransfer(
                                          transfer
                                        )
                                      }
                                    >

                                      <span>
                                        ×
                                      </span>

                                      Sil

                                    </button>

                                  </div>

                                )
                              }

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


          <div className="transfer-list-footer">

            <span>

              Toplam{" "}

              <strong>
                {
                  filteredTransfers.length
                }
              </strong>

              {" "}

              virman

            </span>


            <div className="transfer-pagination">

              <button
                type="button"
                disabled
              >
                ‹
              </button>

              <button
                type="button"
                className="active"
              >
                1
              </button>

              <button
                type="button"
                disabled
              >
                ›
              </button>

            </div>


            <span>
              25 / sayfa
            </span>

          </div>

        </div>

      </div>


      {/* =================================================
          DETAY MODALI
      ================================================= */}

      {
        detailTransferData && (

          <div
            className="customer-transfer-modal-overlay"
            onMouseDown={(event) => {

              if (
                event.target ===
                event.currentTarget
              ) {

                setDetailTransferData(
                  null
                );

              }

            }}
          >

            <div
              className="customer-transfer-detail-modal"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >

              <div className="customer-transfer-modal-header">

                <div>

                  <strong>
                    Cari Virman Detayı
                  </strong>

                  <span>
                    {
                      detailTransferData.document
                    }
                  </span>

                </div>


                <button
                  type="button"
                  onClick={() =>
                    setDetailTransferData(
                      null
                    )
                  }
                >
                  ×
                </button>

              </div>


              <div className="customer-transfer-detail-body">

                <div>

                  <span>
                    TARİH
                  </span>

                  <strong>
                    {
                      detailTransferData.date
                    }
                  </strong>

                </div>


                <div>

                  <span>
                    BELGE NO
                  </span>

                  <strong>
                    {
                      detailTransferData.document
                    }
                  </strong>

                </div>


                <div>

                  <span>
                    KAYNAK CARİ
                  </span>

                  <strong>
                    {
                      detailTransferData.source ||
                      detailTransferData.sourceCustomerName
                    }
                  </strong>

                </div>


                <div>

                  <span>
                    HEDEF CARİ
                  </span>

                  <strong>
                    {
                      detailTransferData.target ||
                      detailTransferData.targetCustomerName
                    }
                  </strong>

                </div>


                <div>

                  <span>
                    TUTAR
                  </span>

                  <strong>
                    {
                      money(
                        detailTransferData.amount
                      )
                    } TL
                  </strong>

                </div>


                <div>

                  <span>
                    AÇIKLAMA
                  </span>

                  <strong>
                    {
                      detailTransferData.description ||
                      "—"
                    }
                  </strong>

                </div>

              </div>


              <div className="customer-transfer-modal-footer">

                <button
                  type="button"
                  className="transfer-cancel"
                  onClick={() =>
                    setDetailTransferData(
                      null
                    )
                  }
                >
                  Kapat
                </button>


                <button
                  type="button"
                  className="transfer-save"
                  onClick={() =>
                    loadTransferToForm(
                      detailTransferData
                    )
                  }
                >
                  Düzenle
                </button>


                <button
                  type="button"
                  className="transfer-delete-button"
                  onClick={() =>
                    deleteTransfer(
                      detailTransferData
                    )
                  }
                >
                  Sil
                </button>

              </div>

            </div>

          </div>

        )
      }

    </div>
  );
}