import { useMemo, useState } from "react";

import {
  MdCalculate,
  MdInsights,
  MdLightbulb,
  MdStorefront,
} from "react-icons/md";

import {
  categories,
  costItems,
  marketplaces,
  strategy,
} from "./marketplaceData";

import "./Marketplace.css";

const tabs = [
  { id: "products", label: "Çok Satanlar", icon: MdInsights },
  { id: "calculator", label: "Maliyet & Kâr", icon: MdCalculate },
  { id: "channels", label: "Pazaryerleri", icon: MdStorefront },
  { id: "strategy", label: "Satış Stratejisi", icon: MdLightbulb },
];

const money = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 2,
});

const SERVICE_VAT = 1.2; // Komisyon/kargo/reklam faturaları %20 KDV'li, indirilebilir.

function Dots({ value }) {
  return (
    <span className="mp-dots" aria-label={`${value}/5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <i key={n} className={n <= value ? "on" : ""} />
      ))}
    </span>
  );
}

function Products({ onPick }) {
  return (
    <section className="mp-card">
      <header className="mp-card-head">
        <h2>Pazaryerinde En Çok Satan Kategoriler</h2>
        <p>
          Tahmini referans değerlerdir. Bir kategoriyi seçerek kâr
          hesaplayıcıyı o kategorinin değerleriyle açabilirsiniz.
        </p>
      </header>

      <div className="mp-table-wrap">
        <table className="mp-table">
          <thead>
            <tr>
              <th>KATEGORİ</th>
              <th>SATIŞ FİYATI</th>
              <th>KOMİSYON</th>
              <th>TİPİK MARJ</th>
              <th>TALEP</th>
              <th>REKABET</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td>
                  <strong>{c.name}</strong>
                  <small>{c.examples}</small>
                  <small className="mp-note">{c.note}</small>
                </td>
                <td>
                  {money.format(c.priceMin)} – {money.format(c.priceMax)}
                </td>
                <td>%{c.commission}</td>
                <td>
                  <span className="mp-badge green">%{c.margin}</span>
                </td>
                <td>
                  <Dots value={c.demand} />
                </td>
                <td>
                  <Dots value={c.competition} />
                </td>
                <td>
                  <button
                    type="button"
                    className="mp-link"
                    onClick={() => onPick(c)}
                  >
                    Hesapla
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const defaults = {
  cost: 250,
  price: 499,
  vat: 20,
  commission: 15,
  shipping: 60,
  packaging: 10,
  ads: 8,
  returns: 5,
  fee: 8,
};

const fields = [
  ["cost", "Alış maliyeti (KDV hariç, ₺)"],
  ["price", "Satış fiyatı (KDV dahil, ₺)"],
  ["vat", "Ürün KDV oranı (%)"],
  ["commission", "Komisyon (%)"],
  ["shipping", "Kargo (KDV dahil, ₺)"],
  ["packaging", "Paketleme (₺)"],
  ["ads", "Reklam (satış fiyatı %)"],
  ["returns", "İade oranı (%)"],
  ["fee", "Hizmet bedeli (KDV dahil, ₺)"],
];

function Calculator({ values, setValues }) {
  const r = useMemo(() => {
    const v = Object.fromEntries(
      Object.entries(values).map(([k, x]) => [k, Number(x) || 0])
    );

    const netPrice = v.price / (1 + v.vat / 100);
    const commission = (v.price * v.commission) / 100 / SERVICE_VAT;
    const ads = (v.price * v.ads) / 100 / SERVICE_VAT;
    const shipping = v.shipping / SERVICE_VAT;
    const fee = v.fee / SERVICE_VAT;
    const returnLoss =
      (v.returns / 100) * ((v.shipping * 2) / SERVICE_VAT + v.packaging);

    const total =
      v.cost + commission + ads + shipping + fee + v.packaging + returnLoss;
    const profit = netPrice - total;

    // Başabaş: fiyata bağlı kalemler (komisyon+reklam) çözülür.
    const variableRate =
      (v.commission + v.ads) / 100 / SERVICE_VAT;
    const fixed =
      v.cost + shipping + fee + v.packaging + returnLoss;
    const denominator = 1 / (1 + v.vat / 100) - variableRate;
    const breakEven = denominator > 0 ? fixed / denominator : null;

    return {
      netPrice,
      commission,
      ads,
      shipping,
      fee,
      returnLoss,
      packaging: v.packaging,
      cost: v.cost,
      total,
      profit,
      margin: netPrice > 0 ? (profit / netPrice) * 100 : 0,
      roi: v.cost > 0 ? (profit / v.cost) * 100 : 0,
      breakEven,
    };
  }, [values]);

  const rows = [
    ["Net satış (KDV hariç)", r.netPrice],
    ["Ürün maliyeti", -r.cost],
    ["Komisyon", -r.commission],
    ["Reklam", -r.ads],
    ["Kargo", -r.shipping],
    ["Hizmet bedeli", -r.fee],
    ["Paketleme", -r.packaging],
    ["İade kaybı (beklenen)", -r.returnLoss],
  ];

  return (
    <div className="mp-calc">
      <section className="mp-card">
        <header className="mp-card-head">
          <h2>Girdiler</h2>
          <p>Tek bir ürün için birim hesabı.</p>
        </header>

        <div className="mp-form">
          {fields.map(([key, label]) => (
            <label key={key}>
              <span>{label}</span>
              <input
                type="number"
                min="0"
                step="any"
                value={values[key]}
                onChange={(e) =>
                  setValues({ ...values, [key]: e.target.value })
                }
              />
            </label>
          ))}
        </div>

        <button
          type="button"
          className="mp-link"
          onClick={() => setValues(defaults)}
        >
          Varsayılana dön
        </button>
      </section>

      <section className="mp-card">
        <header className="mp-card-head">
          <h2>Sonuç</h2>
          <p>Komisyon, kargo ve reklam faturalarındaki KDV indirilebilir kabul edilmiştir.</p>
        </header>

        <div className="mp-kpis">
          <div className={`mp-kpi ${r.profit >= 0 ? "green" : "red"}`}>
            <span>Birim net kâr</span>
            <strong>{money.format(r.profit)}</strong>
          </div>
          <div className="mp-kpi">
            <span>Kâr marjı</span>
            <strong>%{r.margin.toFixed(1)}</strong>
          </div>
          <div className="mp-kpi">
            <span>Yatırım getirisi</span>
            <strong>%{r.roi.toFixed(1)}</strong>
          </div>
          <div className="mp-kpi">
            <span>Başabaş fiyatı</span>
            <strong>
              {r.breakEven ? money.format(r.breakEven) : "—"}
            </strong>
          </div>
        </div>

        <table className="mp-table mp-breakdown">
          <tbody>
            {rows.map(([label, amount]) => (
              <tr key={label}>
                <td>{label}</td>
                <td className={amount < 0 ? "neg" : ""}>
                  {money.format(amount)}
                </td>
              </tr>
            ))}
            <tr className="total">
              <td>Net kâr</td>
              <td>{money.format(r.profit)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="mp-card mp-wide">
        <header className="mp-card-head">
          <h2>Maliyet Kalemleri</h2>
          <p>Satışta gözden kaçırılmaması gereken tüm giderler.</p>
        </header>
        <ul className="mp-list">
          {costItems.map((c) => (
            <li key={c.name}>
              <strong>{c.name}</strong>
              <span>{c.desc}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Channels() {
  return (
    <div className="mp-grid">
      {marketplaces.map((m) => (
        <article className="mp-card" key={m.id}>
          <h3>{m.name}</h3>
          <dl>
            <dt>Trafik</dt>
            <dd>{m.traffic}</dd>
            <dt>Komisyon</dt>
            <dd>{m.commissionRange}</dd>
            <dt>Ödeme vadesi</dt>
            <dd>{m.payout}</dd>
          </dl>
          <p>{m.fit}</p>
        </article>
      ))}
    </div>
  );
}

function Strategy() {
  return (
    <div className="mp-grid">
      {strategy.map((s) => (
        <article className="mp-card" key={s.title}>
          <h3>{s.title}</h3>
          <ul className="mp-bullets">
            {s.items.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

export default function Marketplace() {
  const [tab, setTab] = useState("products");
  const [values, setValues] = useState(defaults);

  const pickCategory = (c) => {
    setValues({
      ...defaults,
      price: Math.round((c.priceMin + c.priceMax) / 2),
      cost: Math.round(
        ((c.priceMin + c.priceMax) / 2) * (1 - c.margin / 100) * 0.7
      ),
      commission: c.commission,
    });
    setTab("calculator");
  };

  return (
    <div className="ren-overview mp-page">
      <header className="ren-overview-header">
        <div>
          <span className="ren-eyebrow">PAZARYERİ</span>
          <h1>E-Ticaret & Pazaryeri</h1>
          <p>
            Ne satılıyor, kaça satılıyor, maliyeti ne ve nasıl satış yaparız.
            Rakamlar tahminidir; güncel tarifeleri pazaryeri panelinden doğrulayın.
          </p>
        </div>
      </header>

      <nav className="mp-tabs">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id)}
          >
            <Icon />
            {label}
          </button>
        ))}
      </nav>

      {tab === "products" && <Products onPick={pickCategory} />}
      {tab === "calculator" && (
        <Calculator values={values} setValues={setValues} />
      )}
      {tab === "channels" && <Channels />}
      {tab === "strategy" && <Strategy />}
    </div>
  );
}
