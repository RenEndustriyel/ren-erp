import {
  MdArrowForward,
  MdCalendarToday,
  MdCreditCard,
  MdPayments,
  MdReceiptLong,
  MdShoppingCart,
  MdTrendingDown,
  MdTrendingUp,
  MdWallet,
} from "react-icons/md";

import "./Overview.css";

const transactions = [
  {
    time: "10:42",
    type: "Satış",
    description: "ABC Sanayi Ltd. Şti.",
    document: "SAT-2026-00124",
    amount: "₺12.450,00",
    color: "blue",
    icon: MdShoppingCart,
  },
  {
    time: "10:18",
    type: "Tahsilat",
    description: "XYZ Gıda - Cari Tahsilat",
    document: "TAH-2026-00087",
    amount: "₺8.750,00",
    color: "green",
    icon: MdPayments,
  },
  {
    time: "09:55",
    type: "Gider",
    description: "Elektrik Faturası",
    document: "GID-2026-00031",
    amount: "₺3.240,00",
    color: "red",
    icon: MdWallet,
  },
  {
    time: "09:30",
    type: "Alış",
    description: "Tedarikçi Alış Faturası",
    document: "ALS-2026-00054",
    amount: "₺16.800,00",
    color: "orange",
    icon: MdReceiptLong,
  },
];

function TodayCard({
  icon: Icon,
  title,
  amount,
  change,
  type,
}) {
  return (
    <article className={`ren-today-card ${type}`}>
      <div className="ren-today-icon">
        <Icon />
      </div>

      <div className="ren-today-content">
        <span>{title}</span>

        <strong>{amount}</strong>
      </div>

      <div className="ren-today-change">
        <MdTrendingUp />
        {change}
      </div>
    </article>
  );
}

function FinanceCard({
  icon: Icon,
  title,
  amount,
  type,
  detail,
}) {
  return (
    <article className="ren-finance-card">
      <div className={`ren-finance-icon ${type}`}>
        <Icon />
      </div>

      <div className="ren-finance-title">
        {title}
      </div>

      <div className={`ren-finance-amount ${type}`}>
        {amount}
      </div>

      <div className="ren-finance-detail">
        {detail}
      </div>
    </article>
  );
}

export default function Overview() {
  return (
    <div className="ren-overview">

      {/* =====================================================
          ÜST BAŞLIK
      ===================================================== */}

      <header className="ren-overview-header">

        <div>
          <span className="ren-eyebrow">
            GENEL BAKIŞ
          </span>

          <h1>
            Hoş geldiniz
          </h1>

          <p>
            İşletmenizin güncel finansal
            durumunu buradan takip edin.
          </p>
        </div>

        <div className="ren-date-box">

          <MdCalendarToday />

          <div>
            <strong>
              17 Ağustos 2026
            </strong>

            <span>
              Pazartesi
            </span>
          </div>

        </div>

      </header>

      {/* =====================================================
          BUGÜNKÜ SATIŞ / TAHSİLAT
      ===================================================== */}

      <section className="ren-today-grid">

        <TodayCard
          icon={MdShoppingCart}
          title="Bugünkü Satış"
          amount="₺47.720,60"
          change="%18,4"
          type="sales"
        />

        <TodayCard
          icon={MdPayments}
          title="Bugünkü Tahsilat"
          amount="₺55.139,10"
          change="%12,7"
          type="collections"
        />

      </section>

      {/* =====================================================
          FİNANS KARTLARI
      ===================================================== */}

      <section className="ren-finance-grid">

        <FinanceCard
          icon={MdTrendingUp}
          title="Bu Ayın Cirosu"
          amount="₺1.198.650,40"
          type="blue"
          detail="%18,4 geçen aya göre"
        />

        <FinanceCard
          icon={MdTrendingDown}
          title="Bu Ayın Masrafları"
          amount="₺935.640,25"
          type="red"
          detail="%12,7 geçen aya göre"
        />

        <FinanceCard
          icon={MdPayments}
          title="Yaklaşan Tahsilatlar"
          amount="₺82.450,00"
          type="orange"
          detail="5 tahsilat bekliyor"
        />

        <FinanceCard
          icon={MdCreditCard}
          title="Yaklaşan Ödemeler"
          amount="₺64.300,00"
          type="purple"
          detail="4 ödeme bekliyor"
        />

      </section>

      {/* =====================================================
          BUGÜNKÜ İŞLEMLER
      ===================================================== */}

      <section className="ren-transactions">

        <header className="ren-transactions-header">

          <div>

            <div className="ren-title-line">

              <h2>
                Bugünkü İşlemler
              </h2>

              <span className="ren-live">
                <i />
                Canlı
              </span>

            </div>

            <p>
              Bugün gerçekleştirilen tüm
              finansal hareketler.
            </p>

          </div>

          <button
            type="button"
            className="ren-view-button"
          >
            Tüm İşlemler
            <MdArrowForward />
          </button>

        </header>

        <div className="ren-table-wrap">

          <table className="ren-table">

            <thead>

              <tr>

                <th>
                  SAAT
                </th>

                <th>
                  İŞLEM
                </th>

                <th>
                  AÇIKLAMA
                </th>

                <th>
                  BELGE NO
                </th>

                <th>
                  TUTAR
                </th>

                <th>
                  DURUM
                </th>

                <th />

              </tr>

            </thead>

            <tbody>

              {transactions.map((item) => {

                const Icon = item.icon;

                return (
                  <tr
                    key={item.document}
                  >

                    <td>
                      <span className="ren-time">
                        {item.time}
                      </span>
                    </td>

                    <td>

                      <span
                        className={`ren-operation ${item.color}`}
                      >
                        <Icon />

                        {item.type}
                      </span>

                    </td>

                    <td>

                      <strong className="ren-description">
                        {item.description}
                      </strong>

                    </td>

                    <td>

                      <span className="ren-document">
                        {item.document}
                      </span>

                    </td>

                    <td>

                      <strong
                        className={`ren-amount ${item.color}`}
                      >
                        {item.amount}
                      </strong>

                    </td>

                    <td>

                      <span className="ren-complete">
                        Tamamlandı
                      </span>

                    </td>

                    <td>

                      <button
                        type="button"
                        className="ren-arrow"
                        aria-label="İşlemi aç"
                      >
                        <MdArrowForward />
                      </button>

                    </td>

                  </tr>
                );

              })}

            </tbody>

          </table>

        </div>

        <button
          type="button"
          className="ren-all-transactions"
        >
          Bugünkü tüm işlemleri görüntüle
          <MdArrowForward />
        </button>

      </section>

    </div>
  );
}