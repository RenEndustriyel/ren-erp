import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  getCustomerById,
} from "../../../lib/customerStore";

import {
  getCustomerMovementsByCustomerId,
} from "../../../lib/movementStore";

import "./CustomerDetail.css";


/* =========================================================
   YARDIMCI
========================================================= */

function numberValue(value) {
  const result =
    Number(value);

  return Number.isFinite(result)
    ? result
    : 0;
}


function money(value) {
  return new Intl.NumberFormat(
    "tr-TR",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(
    Math.abs(
      numberValue(value)
    )
  );
}


function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(
      `${value}T00:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "tr-TR"
  ).format(
    date
  );
}


/* =========================================================
   COMPONENT
========================================================= */

export default function CustomerDetail() {

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [
    searchParams,
  ] = useSearchParams();


  const customerId =
    searchParams.get("id") ||
    location.state?.customer?.id ||
    "";


  const [
    customer,
    setCustomer,
  ] = useState(
    location.state?.customer ||
      null
  );


  const [
    movements,
    setMovements,
  ] = useState([]);


  const [
    activeTab,
    setActiveTab,
  ] = useState(
    "overview"
  );


  const [
    activeMenu,
    setActiveMenu,
  ] = useState(null);


  /* =======================================================
     CARİYİ VE HAREKETLERİ YÜKLE
  ======================================================= */

  const refreshData = () => {

    if (!customerId) {
      return;
    }


    const freshCustomer =
      getCustomerById(
        customerId
      );


    if (freshCustomer) {
      setCustomer(
        freshCustomer
      );
    }


    const rawMovements =
      getCustomerMovementsByCustomerId(
        customerId
      );


    setMovements(
      Array.isArray(
        rawMovements
      )
        ? rawMovements
        : []
    );

  };


  useEffect(() => {

    refreshData();


    const refresh =
      () => {
        refreshData();
      };


    window.addEventListener(
      "ren-customers-updated",
      refresh
    );

    window.addEventListener(
      "ren-customer-movements-updated",
      refresh
    );

    window.addEventListener(
      "ren-invoices-updated",
      refresh
    );

    window.addEventListener(
      "ren-cash-bank-updated",
      refresh
    );

    window.addEventListener(
      "storage",
      refresh
    );


    return () => {

      window.removeEventListener(
        "ren-customers-updated",
        refresh
      );

      window.removeEventListener(
        "ren-customer-movements-updated",
        refresh
      );

      window.removeEventListener(
        "ren-invoices-updated",
        refresh
      );

      window.removeEventListener(
        "ren-cash-bank-updated",
        refresh
      );

      window.removeEventListener(
        "storage",
        refresh
      );

    };

  }, [
    customerId,
  ]);


  if (!customer) {

    return (
      <div className="customer-detail-page">

        <div className="customer-detail-container">

          <div className="customer-detail-card customer-detail-full-card">

            <h2>
              Cari bulunamadı
            </h2>

            <p>
              Görüntülemek istediğiniz cari kayıt bulunamadı.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/customers"
                )
              }
            >
              CARİ LİSTESİNE DÖN
            </button>

          </div>

        </div>

      </div>
    );

  }


  /* =======================================================
     CARİ TİPİ
  ======================================================= */

  const isSupplier =
    String(
      customer.type ||
      ""
    )
      .trim()
      .toLocaleLowerCase(
        "tr-TR"
      ) ===
      "tedarikçi" ||
    String(
      customer.type ||
      ""
    )
      .trim()
      .toLocaleLowerCase(
        "tr-TR"
      ) ===
      "tedarikci";


  /* =======================================================
     HAREKETLERİ CARİ TİPİNE GÖRE NORMALLEŞTİR
  ======================================================= */

  const normalizedMovements =
    useMemo(() => {

      return movements
        .map(
          (movement) => {

            const rawDebt =
              numberValue(
                movement.debt
              );

            const rawCredit =
              numberValue(
                movement.credit
              );


            /*
             * TEDARİKÇİ:
             *
             * Alış = bizim borcumuz
             * Ödeme = borcu azaltır
             */

            if (isSupplier) {

              if (
                movement.type ===
                "Alış"
              ) {

                return {
                  ...movement,

                  debt:
                    Math.max(
                      rawDebt,
                      rawCredit
                    ),

                  credit:
                    0,
                };

              }


              if (
                movement.type ===
                "Ödeme"
              ) {

                return {
                  ...movement,

                  debt:
                    0,

                  credit:
                    Math.max(
                      rawCredit,
                      rawDebt
                    ),

                };

              }

            }


            /*
             * MÜŞTERİ:
             *
             * Satış = müşterinin borcu
             * Tahsilat = borcu azaltır
             */

            if (
              movement.type ===
              "Satış"
            ) {

              return {
                ...movement,

                debt:
                  Math.max(
                    rawDebt,
                    rawCredit
                  ),

                credit:
                  0,
              };

            }


            if (
              movement.type ===
              "Tahsilat"
            ) {

              return {
                ...movement,

                debt:
                  0,

                credit:
                  Math.max(
                    rawCredit,
                    rawDebt
                  ),
              };

            }


            return {
              ...movement,

              debt:
                rawDebt,

              credit:
                rawCredit,
            };

          }
        )
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

    }, [
      movements,
      isSupplier,
    ]);


  /* =======================================================
     TOPLAMLAR
  ======================================================= */

  const totals =
    useMemo(() => {

      let debt =
        0;

      let credit =
        0;


      normalizedMovements.forEach(
        (movement) => {

          debt +=
            numberValue(
              movement.debt
            );

          credit +=
            numberValue(
              movement.credit
            );

        }
      );


      return {
        debt,
        credit,
      };

    }, [
      normalizedMovements,
    ]);


  /* =======================================================
     BAKİYE
  ======================================================= */

  const currentBalance =
    Math.max(
      0,
      totals.debt -
        totals.credit
    );


  const isSettled =
    currentBalance <
    0.005;


  /*
   * Hem müşteri hem tedarikçi için
   * borç / alacak etiketi iş mantığına göre.
   *
   * Bu ekranda:
   *
   * Borçlu    = cari bize borçlu değil,
   *             bizim o cariye borcumuz var
   *             anlamında tedarikçide;
   *             müşteride satış borcu.
   *
   * Daha anlaşılır olması için
   * tip bazlı metin kullanıyoruz.
   */

  const statusLabel =
    isSettled
      ? "Bakiyesi Yok"
      : "Borçlu";


  const statusClass =
    isSettled
      ? "cari-status-zero"
      : "cari-status-borclu";


  /* =======================================================
     SON HAREKETLER
  ======================================================= */

  const recentMovements =
    normalizedMovements
      .slice()
      .reverse()
      .slice(
        0,
        5
      );


  /* =======================================================
     BUTONLAR
  ======================================================= */

  const goBack = () => {

    navigate(
      "/customers"
    );

  };


  const editCustomer = () => {

    navigate(
      `/customers/edit/${encodeURIComponent(
        customer.id
      )}`,
      {
        state: {
          customer,
        },
      }
    );

  };


  const newSale = () => {

    navigate(
      `/invoices/new?type=sales&customerId=${encodeURIComponent(
        customer.id
      )}`,
      {
        state: {
          customer,
        },
      }
    );

  };


  const newPurchase = () => {

    navigate(
      `/invoices/new?type=purchase&customerId=${encodeURIComponent(
        customer.id
      )}`,
      {
        state: {
          customer,
        },
      }
    );

  };


  const newCollection = () => {

    navigate(
      "/customers/collections",
      {
        state: {
          customer,
        },
      }
    );

  };


  const newPayment = () => {

    navigate(
      "/customers/payments",
      {
        state: {
          customer,
        },
      }
    );

  };


  const detailMovement =
    (movement) => {

      alert(
        `Hareket Detayı\n\n` +
        `Belge: ${
          movement.document ||
          "—"
        }\n` +
        `Tarih: ${
          formatDate(
            movement.date
          )
        }\n` +
        `İşlem: ${
          movement.type ||
          "—"
        }\n` +
        `Açıklama: ${
          movement.description ||
          "—"
        }\n` +
        `Borç: ${
          money(
            movement.debt
          )
        } TL\n` +
        `Alacak: ${
          money(
            movement.credit
          )
        } TL`
      );


      setActiveMenu(
        null
      );

    };


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <div
      className="customer-detail-page"
      onClick={() =>
        setActiveMenu(
          null
        )
      }
    >

      <div className="customer-detail-container">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="customer-detail-header">

          <div className="customer-detail-heading">

            <button
              type="button"
              className="customer-detail-back"
              onClick={
                goBack
              }
            >
              ←
            </button>


            <div>

              <div className="customer-detail-breadcrumb">

                Müşteri - Tedarikçi

                <span>
                  /
                </span>

                Hesap Detayı

              </div>


              <div className="customer-detail-title-row">

                <div className="customer-detail-avatar">

                  {
                    String(
                      customer.name ||
                      "C"
                    )
                      .charAt(
                        0
                      )
                      .toUpperCase()
                  }

                </div>


                <div>

                  <h1>
                    {
                      customer.name
                    }
                  </h1>


                  <div className="customer-detail-meta">

                    <span>
                      {
                        customer.code
                      }
                    </span>

                    <span>
                      {
                        isSupplier
                          ? "Tedarikçi"
                          : "Müşteri"
                      }
                    </span>

                  </div>

                </div>

              </div>

            </div>

          </div>


          {/* =================================================
              TİPE GÖRE DOĞRU BUTONLAR
          ================================================= */}

          <div className="customer-detail-actions">

            {
              isSupplier ? (

                <>
                  <button
                    type="button"
                    className="customer-detail-secondary"
                    onClick={
                      newPayment
                    }
                  >
                    Ödeme
                  </button>

                  <button
                    type="button"
                    className="customer-detail-secondary"
                    onClick={
                      newPurchase
                    }
                  >
                    Alış
                  </button>
                </>

              ) : (

                <>
                  <button
                    type="button"
                    className="customer-detail-secondary"
                    onClick={
                      newCollection
                    }
                  >
                    Tahsilat
                  </button>

                  <button
                    type="button"
                    className="customer-detail-secondary"
                    onClick={
                      newSale
                    }
                  >
                    Satış
                  </button>
                </>

              )
            }


            <button
              type="button"
              className="customer-detail-primary"
              onClick={
                editCustomer
              }
            >
              Düzenle
            </button>

          </div>

        </div>


        {/* =================================================
            BAKİYE ÖZETİ
        ================================================= */}

        <div className="customer-detail-summary">


          <div className="customer-detail-summary-card">

            <span>
              GÜNCEL BAKİYE
            </span>

            <strong
              className={
                statusClass
              }
            >
              {
                statusLabel
              }
            </strong>

            <small>
              {
                isSettled
                  ? "Cari hesap kapanmış"
                  : isSupplier
                    ? "Tedarikçiye olan güncel borç"
                    : "Müşteriden kalan güncel alacak"
              }
            </small>

          </div>


          <div className="customer-detail-summary-card">

            <span>
              {
                isSupplier
                  ? "KALAN BORÇ"
                  : "KALAN ALACAK"
              }
            </span>

            <strong
              className={
                isSettled
                  ? "cari-status-zero"
                  : "cari-status-borclu"
              }
            >
              {
                money(
                  currentBalance
                )
              } TL
            </strong>

          </div>


          <div className="customer-detail-summary-card">

            <span>
              {
                isSupplier
                  ? "TOPLAM ALIŞ"
                  : "TOPLAM SATIŞ"
              }
            </span>

            <strong>
              {
                money(
                  totals.debt
                )
              } TL
            </strong>

          </div>


          <div className="customer-detail-summary-card">

            <span>
              {
                isSupplier
                  ? "TOPLAM ÖDEME"
                  : "TOPLAM TAHSİLAT"
              }
            </span>

            <strong
              className="cari-status-alacakli"
            >
              {
                money(
                  totals.credit
                )
              } TL
            </strong>

          </div>


          <div className="customer-detail-summary-card">

            <span>
              VADE
            </span>

            <strong>
              {
                customer.term ||
                (
                  customer.dueDays
                    ? `${customer.dueDays} Gün`
                    : "—"
                )
              }
            </strong>

          </div>

        </div>


        {/* =================================================
            TABLAR
        ================================================= */}

        <div className="customer-detail-tabs">

          <button
            type="button"
            className={
              activeTab ===
              "overview"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab(
                "overview"
              )
            }
          >
            Genel Bakış
          </button>


          <button
            type="button"
            className={
              activeTab ===
              "movements"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab(
                "movements"
              )
            }
          >
            Cari Hareketler
          </button>


          <button
            type="button"
            className={
              activeTab ===
              "info"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab(
                "info"
              )
            }
          >
            Hesap Bilgileri
          </button>

        </div>


        {/* =================================================
            GENEL BAKIŞ
        ================================================= */}

        {
          activeTab ===
          "overview" && (

            <div className="customer-detail-content">

              <div className="customer-detail-grid">


                <div className="customer-detail-card">

                  <div className="customer-detail-card-header">

                    <strong>
                      Son Hareketler
                    </strong>

                    <button
                      type="button"
                      onClick={() =>
                        setActiveTab(
                          "movements"
                        )
                      }
                    >
                      Tümünü Gör
                    </button>

                  </div>


                  <div className="customer-detail-movement-list">

                    {
                      recentMovements.length ===
                      0 ? (

                        <div className="customer-detail-movement">

                          <div className="customer-detail-movement-info">

                            <strong>
                              Henüz hareket yok
                            </strong>

                            <span>
                              Bu cari hesapta kayıtlı hareket bulunmuyor.
                            </span>

                          </div>

                        </div>

                      ) : (

                        recentMovements.map(
                          (
                            movement
                          ) => (

                            <div
                              className="customer-detail-movement"
                              key={
                                movement.id
                              }
                            >

                              <div className="customer-detail-movement-icon">

                                {
                                  movement.type ===
                                  "Ödeme" ||
                                  movement.type ===
                                  "Tahsilat"
                                    ? "₺"
                                    : movement.type ===
                                      "Alış"
                                    ? "A"
                                    : "S"
                                }

                              </div>


                              <div className="customer-detail-movement-info">

                                <strong>
                                  {
                                    movement.type
                                  }
                                </strong>

                                <span>
                                  {
                                    movement.description ||
                                    movement.document ||
                                    "—"
                                  }
                                </span>

                              </div>


                              <div className="customer-detail-movement-amount">

                                <strong
                                  className={
                                    movement.debt >
                                    0
                                      ? "debt"
                                      : "credit"
                                  }
                                >

                                  {
                                    movement.debt >
                                    0
                                      ? `+${money(
                                          movement.debt
                                        )}`
                                      : `-${money(
                                          movement.credit
                                        )}`
                                  } TL

                                </strong>

                                <small>
                                  {
                                    formatDate(
                                      movement.date
                                    )
                                  }
                                </small>

                              </div>

                            </div>

                          )
                        )

                      )
                    }

                  </div>

                </div>


                <div className="customer-detail-card">

                  <div className="customer-detail-card-header">

                    <strong>
                      Hesap Bilgileri
                    </strong>

                    <button
                      type="button"
                      onClick={() =>
                        setActiveTab(
                          "info"
                        )
                      }
                    >
                      Görüntüle
                    </button>

                  </div>


                  <div className="customer-detail-info-list">

                    <div>
                      <span>
                        Hesap Türü
                      </span>

                      <strong>
                        {
                          isSupplier
                            ? "Tedarikçi"
                            : "Müşteri"
                        }
                      </strong>
                    </div>


                    <div>
                      <span>
                        Yetkili
                      </span>

                      <strong>
                        {
                          customer.contact ||
                          customer.contactPerson ||
                          "—"
                        }
                      </strong>
                    </div>


                    <div>
                      <span>
                        Telefon
                      </span>

                      <strong>
                        {
                          customer.phone ||
                          "—"
                        }
                      </strong>
                    </div>


                    <div>
                      <span>
                        E-posta
                      </span>

                      <strong>
                        {
                          customer.email ||
                          "—"
                        }
                      </strong>
                    </div>


                    <div>
                      <span>
                        Vade
                      </span>

                      <strong>
                        {
                          customer.term ||
                          (
                            customer.dueDays
                              ? `${customer.dueDays} Gün`
                              : "—"
                          )
                        }
                      </strong>
                    </div>

                  </div>

                </div>

              </div>

            </div>

          )
        }


        {/* =================================================
            CARİ HAREKETLER
        ================================================= */}

        {
          activeTab ===
          "movements" && (

            <div className="customer-detail-card customer-detail-full-card">

              <div className="customer-detail-card-header">

                <div>

                  <strong>
                    Cari Hareketler
                  </strong>

                  <span>
                    {
                      customer.name
                    }
                  </span>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setActiveTab(
                      "overview"
                    )
                  }
                >
                  Genel Bakış
                </button>

              </div>


              <div className="customer-detail-table-wrapper">

                <table className="customer-detail-table">

                  <thead>

                    <tr>

                      <th>
                        TARİH
                      </th>

                      <th>
                        BELGE NO
                      </th>

                      <th>
                        İŞLEM
                      </th>

                      <th>
                        AÇIKLAMA
                      </th>

                      <th>
                        BORÇ
                      </th>

                      <th>
                        ALACAK
                      </th>

                      <th>
                        BAKİYE
                      </th>

                      <th>
                        İŞLEMLER
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {
                      normalizedMovements.length ===
                      0 ? (

                        <tr>

                          <td
                            colSpan="8"
                            style={{
                              textAlign:
                                "center",
                              padding:
                                "40px",
                            }}
                          >
                            Bu cari hesapta henüz hareket bulunmuyor.
                          </td>

                        </tr>

                      ) : (

                        (() => {

                          let runningBalance =
                            0;


                          return normalizedMovements
                            .map(
                              (
                                movement
                              ) => {

                                runningBalance =
                                  runningBalance +
                                  numberValue(
                                    movement.debt
                                  ) -
                                  numberValue(
                                    movement.credit
                                  );


                                return (
                                  <tr
                                    key={
                                      movement.id
                                    }
                                  >

                                    <td>
                                      {
                                        formatDate(
                                          movement.date
                                        )
                                      }
                                    </td>


                                    <td className="customer-detail-document">
                                      {
                                        movement.document ||
                                        "—"
                                      }
                                    </td>


                                    <td>

                                      <span
                                        className={
                                          movement.type ===
                                            "Tahsilat" ||
                                          movement.type ===
                                            "Ödeme"
                                            ? "customer-detail-type payment"
                                            : "customer-detail-type sale"
                                        }
                                      >
                                        {
                                          movement.type
                                        }
                                      </span>

                                    </td>


                                    <td>
                                      {
                                        movement.description ||
                                        "—"
                                      }
                                    </td>


                                    <td className="detail-debt">

                                      {
                                        numberValue(
                                          movement.debt
                                        ) > 0
                                          ? money(
                                              movement.debt
                                            )
                                          : "—"
                                      }

                                    </td>


                                    <td className="detail-credit">

                                      {
                                        numberValue(
                                          movement.credit
                                        ) > 0
                                          ? money(
                                              movement.credit
                                            )
                                          : "—"
                                      }

                                    </td>


                                    <td
                                      className={
                                        runningBalance >
                                        0
                                          ? "cari-status-borclu"
                                          : runningBalance <
                                            0
                                          ? "cari-status-alacakli"
                                          : "cari-status-zero"
                                      }
                                    >

                                      {
                                        money(
                                          runningBalance
                                        )
                                      }{" "}
                                      TL

                                    </td>


                                    <td>

                                      <div className="customer-detail-row-action">

                                        <button
                                          type="button"
                                          onClick={(
                                            event
                                          ) => {

                                            event.stopPropagation();

                                            setActiveMenu(
                                              activeMenu ===
                                                movement.id
                                                ? null
                                                : movement.id
                                            );

                                          }}
                                        >
                                          ⋮
                                        </button>


                                        {
                                          activeMenu ===
                                          movement.id && (

                                            <div className="customer-detail-row-menu">

                                              <button
                                                type="button"
                                                onClick={() =>
                                                  detailMovement(
                                                    movement
                                                  )
                                                }
                                              >
                                                Detay
                                              </button>

                                              <button
                                                type="button"
                                                onClick={() =>
                                                  alert(
                                                    "Bu hareket için düzenleme ekranı daha sonra bağlanacaktır."
                                                  )
                                                }
                                              >
                                                Düzenle
                                              </button>

                                              <button
                                                type="button"
                                                onClick={() =>
                                                  alert(
                                                    "PDF hazırlanacak."
                                                  )
                                                }
                                              >
                                                PDF
                                              </button>

                                            </div>

                                          )
                                        }

                                      </div>

                                    </td>

                                  </tr>
                                );

                              }
                            );

                        })()

                      )
                    }

                  </tbody>

                </table>

              </div>

            </div>

          )
        }


        {/* =================================================
            HESAP BİLGİLERİ
        ================================================= */}

        {
          activeTab ===
          "info" && (

            <div className="customer-detail-content">

              <div className="customer-detail-card customer-detail-full-card">

                <div className="customer-detail-card-header">

                  <strong>
                    Hesap Bilgileri
                  </strong>

                  <button
                    type="button"
                    onClick={
                      editCustomer
                    }
                  >
                    Düzenle
                  </button>

                </div>


                <div className="customer-detail-information-grid">

                  <div>
                    <span>
                      Hesap Türü
                    </span>

                    <strong>
                      {
                        isSupplier
                          ? "Tedarikçi"
                          : "Müşteri"
                      }
                    </strong>
                  </div>


                  <div>
                    <span>
                      Cari Kodu
                    </span>

                    <strong>
                      {
                        customer.code
                      }
                    </strong>
                  </div>


                  <div>
                    <span>
                      Hesap Adı / Ünvan
                    </span>

                    <strong>
                      {
                        customer.name
                      }
                    </strong>
                  </div>


                  <div>
                    <span>
                      Yetkili
                    </span>

                    <strong>
                      {
                        customer.contact ||
                        customer.contactPerson ||
                        "—"
                      }
                    </strong>
                  </div>


                  <div>
                    <span>
                      Telefon
                    </span>

                    <strong>
                      {
                        customer.phone ||
                        "—"
                      }
                    </strong>
                  </div>


                  <div>
                    <span>
                      E-posta
                    </span>

                    <strong>
                      {
                        customer.email ||
                        "—"
                      }
                    </strong>
                  </div>


                  <div>
                    <span>
                      Vergi Dairesi
                    </span>

                    <strong>
                      {
                        customer.taxOffice ||
                        "—"
                      }
                    </strong>
                  </div>


                  <div>
                    <span>
                      Vergi No
                    </span>

                    <strong>
                      {
                        customer.taxNumber ||
                        customer.taxNo ||
                        "—"
                      }
                    </strong>
                  </div>


                  <div>
                    <span>
                      Vade
                    </span>

                    <strong>
                      {
                        customer.term ||
                        (
                          customer.dueDays
                            ? `${customer.dueDays} Gün`
                            : "—"
                        )
                      }
                    </strong>
                  </div>


                  <div className="customer-detail-address">

                    <span>
                      Adres
                    </span>

                    <strong>

                      {
                        customer.address ||
                        "—"
                      }

                      <br />

                      {
                        customer.district ||
                        "—"
                      }

                      {" / "}

                      {
                        customer.city ||
                        "—"
                      }

                    </strong>

                  </div>

                </div>


                <div className="customer-detail-note">

                  <span>
                    Not
                  </span>

                  <p>
                    {
                      customer.notes ||
                      customer.note ||
                      "—"
                    }
                  </p>

                </div>

              </div>

            </div>

          )
        }

      </div>

    </div>

  );

}