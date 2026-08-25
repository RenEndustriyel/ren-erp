import { useMemo, useState } from "react";
import "./CustomerTransfer.css";

const customers = [
  {
    id: 1,
    code: "CR-0001",
    name: "Akın Ambalaj",
  },
  {
    id: 2,
    code: "CR-0002",
    name: "Aykım Temizlik Maddeleri",
  },
  {
    id: 3,
    code: "CR-0003",
    name: "Yörsan",
  },
  {
    id: 4,
    code: "CR-0004",
    name: "Matlı Holding",
  },
];

const initialTransfers = [
  {
    id: 1,
    date: "18.08.2026",
    document: "VRM-2026-0004",
    source: "Akın Ambalaj",
    target: "Yörsan",
    amount: 2500,
    description: "Cari bakiye aktarımı",
  },
  {
    id: 2,
    date: "15.08.2026",
    document: "VRM-2026-0003",
    source: "Aykım Temizlik Maddeleri",
    target: "Akın Ambalaj",
    amount: 1750,
    description: "Cari virman",
  },
  {
    id: 3,
    date: "10.08.2026",
    document: "VRM-2026-0002",
    source: "Yörsan",
    target: "Matlı Holding",
    amount: 5000,
    description: "Hesap aktarımı",
  },
];

function money(value) {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function today() {
  const date = new Date();

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}.${month}.${year}`;
}

export default function CustomerTransfer() {
  const [transfers, setTransfers] =
    useState(initialTransfers);

  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [date, setDate] = useState(today());
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const [search, setSearch] = useState("");
  const [activeMenu, setActiveMenu] =
    useState(null);

  const filteredTransfers = useMemo(() => {
    const query = search
      .trim()
      .toLocaleLowerCase("tr-TR");

    if (!query) {
      return transfers;
    }

    return transfers.filter((item) => {
      return (
        item.document
          .toLocaleLowerCase("tr-TR")
          .includes(query) ||
        item.source
          .toLocaleLowerCase("tr-TR")
          .includes(query) ||
        item.target
          .toLocaleLowerCase("tr-TR")
          .includes(query) ||
        item.description
          .toLocaleLowerCase("tr-TR")
          .includes(query)
      );
    });
  }, [transfers, search]);

  const selectedSource = customers.find(
    (item) => item.id === Number(source)
  );

  const selectedTarget = customers.find(
    (item) => item.id === Number(target)
  );

  const saveTransfer = () => {
    if (!source || !target) {
      alert(
        "Lütfen kaynak ve hedef cari hesapları seçin."
      );
      return;
    }

    if (source === target) {
      alert(
        "Kaynak ve hedef cari aynı olamaz."
      );
      return;
    }

    const numericAmount = Number(
      String(amount)
        .replace(/\./g, "")
        .replace(",", ".")
    );

    if (
      !numericAmount ||
      numericAmount <= 0
    ) {
      alert(
        "Lütfen geçerli bir virman tutarı girin."
      );
      return;
    }

    const newTransfer = {
      id: Date.now(),
      date,
      document: `VRM-2026-${String(
        transfers.length + 5
      ).padStart(4, "0")}`,
      source: selectedSource.name,
      target: selectedTarget.name,
      amount: numericAmount,
      description:
        description.trim() ||
        "Cari virman",
    };

    setTransfers((prev) => [
      newTransfer,
      ...prev,
    ]);

    setSource("");
    setTarget("");
    setAmount("");
    setDescription("");

    alert("Cari virman başarıyla kaydedildi.");
  };

  const clearForm = () => {
    setSource("");
    setTarget("");
    setAmount("");
    setDescription("");
  };

  const detailTransfer = (transfer) => {
    alert(
      `Cari Virman Detayı\n\n` +
        `Belge: ${transfer.document}\n` +
        `Tarih: ${transfer.date}\n` +
        `Kaynak: ${transfer.source}\n` +
        `Hedef: ${transfer.target}\n` +
        `Tutar: ${money(transfer.amount)} TL\n` +
        `Açıklama: ${transfer.description}`
    );

    setActiveMenu(null);
  };

  const editTransfer = (transfer) => {
    alert(
      `${transfer.document} virman düzenleme ekranı hazırlanacak.`
    );

    setActiveMenu(null);
  };

  const deleteTransfer = (transfer) => {
    const confirmed = window.confirm(
      `"${transfer.document}" virmanını silmek istediğinize emin misiniz?`
    );

    if (!confirmed) {
      setActiveMenu(null);
      return;
    }

    setTransfers((prev) =>
      prev.filter(
        (item) => item.id !== transfer.id
      )
    );

    setActiveMenu(null);
  };

  const exportExcel = () => {
    const headers = [
      "Tarih",
      "Belge No",
      "Kaynak Cari",
      "Hedef Cari",
      "Tutar",
      "Açıklama",
    ];

    const rows = filteredTransfers.map(
      (item) => [
        item.date,
        item.document,
        item.source,
        item.target,
        item.amount,
        item.description,
      ]
    );

    const csv = [
      headers.join(";"),
      ...rows.map((row) =>
        row
          .map(
            (value) =>
              `"${String(
                value ?? ""
              ).replace(/"/g, '""')}"`
          )
          .join(";")
      ),
    ].join("\n");

    const blob = new Blob(
      ["\ufeff" + csv],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      "REN-ERP-Cari-Virmanlar.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    setActiveMenu(null);
  };

  const exportPdf = () => {
    window.print();
    setActiveMenu(null);
  };

  return (
    <div
      className="customer-transfer-page"
      onClick={() =>
        setActiveMenu(null)
      }
    >
      <div className="customer-transfer-container">

        {/* HEADER */}

        <div className="customer-transfer-header">

          <div>

            <div className="customer-transfer-breadcrumb">
              Müşteri - Tedarikçi
              <span>/</span>
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
              onClick={(event) => {
                event.stopPropagation();
                exportPdf();
              }}
            >
              PDF
            </button>

            <button
              className="transfer-header-button"
              onClick={(event) => {
                event.stopPropagation();
                exportExcel();
              }}
            >
              Excel
            </button>

          </div>

        </div>


        {/* VİRMAN FORMU */}

        <div className="customer-transfer-form-card">

          <div className="transfer-card-title">

            <div>
              <strong>
                Yeni Cari Virman
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
                value={source}
                onChange={(event) =>
                  setSource(
                    event.target.value
                  )
                }
              >
                <option value="">
                  Cari hesap seçin
                </option>

                {customers.map((customer) => (
                  <option
                    key={customer.id}
                    value={customer.id}
                  >
                    {customer.name} —{" "}
                    {customer.code}
                  </option>
                ))}
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
                value={target}
                onChange={(event) =>
                  setTarget(
                    event.target.value
                  )
                }
              >
                <option value="">
                  Cari hesap seçin
                </option>

                {customers.map((customer) => (
                  <option
                    key={customer.id}
                    value={customer.id}
                  >
                    {customer.name} —{" "}
                    {customer.code}
                  </option>
                ))}
              </select>

            </div>


            <div className="transfer-field">

              <label>
                Tarih
              </label>

              <input
                value={date}
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
                  value={amount}
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
                value={description}
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
              className="transfer-cancel"
              onClick={clearForm}
            >
              Temizle
            </button>

            <button
              className="transfer-save"
              onClick={saveTransfer}
            >
              Virmanı Kaydet
            </button>

          </div>

        </div>


        {/* GEÇMİŞ VİRMANLAR */}

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
                  value={search}
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
                onClick={exportExcel}
              >
                Excel
              </button>

              <button
                className="transfer-tool-button"
                onClick={exportPdf}
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

                {filteredTransfers.length === 0 ? (

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
                    (transfer) => (

                      <tr
                        key={transfer.id}
                      >

                        <td>
                          {transfer.date}
                        </td>

                        <td>

                          <span className="transfer-document">
                            {transfer.document}
                          </span>

                        </td>

                        <td>

                          <div className="transfer-party">

                            <span className="transfer-party-icon">
                              {transfer.source
                                .charAt(0)
                                .toUpperCase()}
                            </span>

                            <strong>
                              {transfer.source}
                            </strong>

                          </div>

                        </td>

                        <td>

                          <div className="transfer-party">

                            <span className="transfer-party-icon target">
                              {transfer.target
                                .charAt(0)
                                .toUpperCase()}
                            </span>

                            <strong>
                              {transfer.target}
                            </strong>

                          </div>

                        </td>

                        <td className="transfer-money">
                          {money(
                            transfer.amount
                          )} TL
                        </td>

                        <td>
                          {transfer.description}
                        </td>


                        <td className="transfer-actions">

                          <div className="transfer-action-wrapper">

                            <button
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


                            {activeMenu ===
                              transfer.id && (

                              <div
                                className="transfer-row-menu"
                                onClick={(event) =>
                                  event.stopPropagation()
                                }
                              >

                                <button
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
                                  onClick={() =>
                                    editTransfer(
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

                            )}

                          </div>

                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>


          <div className="transfer-list-footer">

            <span>
              Toplam{" "}
              <strong>
                {filteredTransfers.length}
              </strong>{" "}
              virman
            </span>

            <div className="transfer-pagination">

              <button disabled>
                ‹
              </button>

              <button className="active">
                1
              </button>

              <button disabled>
                ›
              </button>

            </div>

            <span>
              25 / sayfa
            </span>

          </div>

        </div>

      </div>
    </div>
  );
}