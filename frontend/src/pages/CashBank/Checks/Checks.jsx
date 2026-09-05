import { useMemo, useState } from "react";
import {
  MdAdd,
  MdArrowBack,
  MdDeleteOutline,
  MdEdit,
  MdSearch,
  MdReceiptLong,
} from "react-icons/md";

import "./Checks.css";

const STORAGE_KEY = "ren_erp_checks";

const DEFAULT_CHECKS = [
  {
    id: "sample-1",
    type: "incoming",
    checkNo: "ÇK-0001",
    party: "Örnek Müşteri",
    amount: 0,
    dueDate: "",
    bank: "",
    status: "portfolio",
    description: "",
  },
];

const STATUS_LABELS = {
  portfolio: "Portföyde",
  collection: "Tahsilde",
  paid: "Ödendi",
  bounced: "Karşılıksız",
  returned: "İade",
};

const TYPE_LABELS = {
  incoming: "Alınan",
  outgoing: "Verilen",
};

function money(value) {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("tr-TR").format(date);
}

function readChecks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeChecks(checks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(checks));
}

function emptyForm() {
  return {
    type: "incoming",
    checkNo: "",
    party: "",
    amount: "",
    dueDate: "",
    bank: "",
    status: "portfolio",
    description: "",
  };
}

export default function Checks() {
  const [checks, setChecks] = useState(() => readChecks());
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const filteredChecks = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr-TR");

    return checks.filter((item) => {
      const matchesSearch =
        !query ||
        String(item.checkNo || "").toLocaleLowerCase("tr-TR").includes(query) ||
        String(item.party || "").toLocaleLowerCase("tr-TR").includes(query) ||
        String(item.bank || "").toLocaleLowerCase("tr-TR").includes(query);

      const matchesType =
        typeFilter === "all" || item.type === typeFilter;

      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [checks, search, typeFilter, statusFilter]);

  const incomingTotal = filteredChecks
    .filter((item) => item.type === "incoming")
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const outgoingTotal = filteredChecks
    .filter((item) => item.type === "outgoing")
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const portfolioTotal = filteredChecks
    .filter((item) => item.status === "portfolio")
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const openCount = filteredChecks.filter(
    (item) => item.status === "portfolio" || item.status === "collection"
  ).length;

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openNew() {
    setEditingId(null);
    setForm(emptyForm());
    setModalOpen(true);
  }

  function openEdit(item) {
    setEditingId(item.id);
    setForm({
      type: item.type || "incoming",
      checkNo: item.checkNo || "",
      party: item.party || "",
      amount: item.amount ?? "",
      dueDate: item.dueDate || "",
      bank: item.bank || "",
      status: item.status || "portfolio",
      description: item.description || "",
    });
    setModalOpen(true);
  }

  function saveCheck(event) {
    event.preventDefault();

    const payload = {
      id: editingId || `check-${Date.now()}`,
      type: form.type,
      checkNo: form.checkNo.trim(),
      party: form.party.trim(),
      amount: Number(form.amount) || 0,
      dueDate: form.dueDate,
      bank: form.bank.trim(),
      status: form.status,
      description: form.description.trim(),
      updatedAt: new Date().toISOString(),
    };

    if (!payload.checkNo || !payload.party) {
      window.alert("Çek no ve cari alanları zorunludur.");
      return;
    }

    const next =
      editingId
        ? checks.map((item) => (item.id === editingId ? payload : item))
        : [payload, ...checks];

    writeChecks(next);
    setChecks(next);
    setModalOpen(false);
  }

  function deleteCheck(item) {
    const confirmed = window.confirm(
      `${item.checkNo || "Bu çek"} silinsin mi?`
    );
    if (!confirmed) return;

    const next = checks.filter((check) => check.id !== item.id);
    writeChecks(next);
    setChecks(next);
  }

  return (
    <div className="ren-checks-page">
      <div className="ren-checks-container">
        <header className="ren-checks-header">
          <div>
            <button
              type="button"
              className="ren-checks-back"
              onClick={() => (window.location.href = "/cash-bank/accounts")}
            >
              <MdArrowBack />
              Kasa ve Bankalara Dön
            </button>

            <div className="ren-checks-breadcrumb">
              <span>Kasa ve Bankalar</span>
              <span>/</span>
              <strong>Çekler</strong>
            </div>

            <h1>Çekler</h1>
            <p>Alınan ve verilen çeklerinizi tek ekrandan yönetin.</p>
          </div>

          <button
            type="button"
            className="ren-checks-primary"
            onClick={openNew}
          >
            <MdAdd />
            Yeni Çek
          </button>
        </header>

        <section className="ren-checks-summary">
          <div className="ren-checks-summary-card">
            <span>TOPLAM ÇEK</span>
            <strong>{filteredChecks.length}</strong>
            <small>{openCount} açık kayıt</small>
          </div>
          <div className="ren-checks-summary-card">
            <span>ALINAN ÇEKLER</span>
            <strong>₺{money(incomingTotal)}</strong>
            <small>{filteredChecks.filter((x) => x.type === "incoming").length} kayıt</small>
          </div>
          <div className="ren-checks-summary-card">
            <span>VERİLEN ÇEKLER</span>
            <strong>₺{money(outgoingTotal)}</strong>
            <small>{filteredChecks.filter((x) => x.type === "outgoing").length} kayıt</small>
          </div>
          <div className="ren-checks-summary-card highlight">
            <span>PORTFÖYDE</span>
            <strong>₺{money(portfolioTotal)}</strong>
            <small>Bekleyen çekler</small>
          </div>
        </section>

        <section className="ren-checks-card">
          <div className="ren-checks-toolbar">
            <div className="ren-checks-search">
              <MdSearch />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Çek no, cari veya banka ara..."
              />
            </div>

            <div className="ren-checks-filter-group">
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                <option value="all">Tüm Çekler</option>
                <option value="incoming">Alınan</option>
                <option value="outgoing">Verilen</option>
              </select>

              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">Tüm Durumlar</option>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {filteredChecks.length ? (
            <div className="ren-checks-table-wrap">
              <table className="ren-checks-table">
                <thead>
                  <tr>
                    <th>ÇEK NO</th>
                    <th>TÜR</th>
                    <th>CARİ</th>
                    <th>BANKA</th>
                    <th>VADE</th>
                    <th>DURUM</th>
                    <th>TUTAR</th>
                    <th>İŞLEM</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredChecks.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <button
                          type="button"
                          className="ren-check-no"
                          onClick={() => openEdit(item)}
                        >
                          <MdReceiptLong />
                          {item.checkNo || "-"}
                        </button>
                      </td>
                      <td>
                        <span className={`ren-check-type ${item.type}`}>
                          {TYPE_LABELS[item.type] || "-"}
                        </span>
                      </td>
                      <td>
                        <div className="ren-check-party">
                          <div className="ren-check-avatar">
                            {(item.party || "?").charAt(0).toLocaleUpperCase("tr-TR")}
                          </div>
                          <div>
                            <strong>{item.party || "-"}</strong>
                          </div>
                        </div>
                      </td>
                      <td>{item.bank || "-"}</td>
                      <td>{formatDate(item.dueDate)}</td>
                      <td>
                        <span className={`ren-check-status ${item.status}`}>
                          {STATUS_LABELS[item.status] || item.status}
                        </span>
                      </td>
                      <td>
                        <strong className="ren-check-total">
                          ₺{money(item.amount)}
                        </strong>
                      </td>
                      <td>
                        <div className="ren-check-actions">
                          <button type="button" title="Düzenle" onClick={() => openEdit(item)}>
                            <MdEdit />
                          </button>
                          <button
                            type="button"
                            className="danger"
                            title="Sil"
                            onClick={() => deleteCheck(item)}
                          >
                            <MdDeleteOutline />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="ren-checks-empty">
              <MdReceiptLong />
              <strong>Henüz çek kaydı bulunmuyor</strong>
              <span>İlk alınan veya verilen çek kaydınızı oluşturabilirsiniz.</span>
              <button type="button" className="ren-checks-primary" onClick={openNew}>
                <MdAdd />
                Yeni Çek
              </button>
            </div>
          )}

          <footer className="ren-checks-footer">
            <span>Gösterilen: <strong>{filteredChecks.length}</strong> kayıt</span>
            <span>Portföy: <strong>₺{money(portfolioTotal)}</strong></span>
          </footer>
        </section>
      </div>

      {modalOpen && (
        <div className="ren-checks-modal-overlay">
          <div className="ren-checks-modal">
            <div className="ren-checks-modal-header">
              <div>
                <strong>{editingId ? "Çeki Düzenle" : "Yeni Çek"}</strong>
                <span>Çek bilgilerini girin.</span>
              </div>
              <button type="button" onClick={() => setModalOpen(false)}>×</button>
            </div>

            <form onSubmit={saveCheck}>
              <div className="ren-checks-form-grid">
                <label>
                  <span>Çek Türü</span>
                  <select value={form.type} onChange={(event) => updateField("type", event.target.value)}>
                    <option value="incoming">Alınan Çek</option>
                    <option value="outgoing">Verilen Çek</option>
                  </select>
                </label>

                <label>
                  <span>Çek No</span>
                  <input value={form.checkNo} onChange={(event) => updateField("checkNo", event.target.value)} />
                </label>

                <label>
                  <span>Cari</span>
                  <input value={form.party} onChange={(event) => updateField("party", event.target.value)} />
                </label>

                <label>
                  <span>Tutar</span>
                  <input type="number" min="0" step="0.01" value={form.amount} onChange={(event) => updateField("amount", event.target.value)} />
                </label>

                <label>
                  <span>Vade</span>
                  <input type="date" value={form.dueDate} onChange={(event) => updateField("dueDate", event.target.value)} />
                </label>

                <label>
                  <span>Banka</span>
                  <input value={form.bank} onChange={(event) => updateField("bank", event.target.value)} />
                </label>

                <label>
                  <span>Durum</span>
                  <select value={form.status} onChange={(event) => updateField("status", event.target.value)}>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>

                <label className="wide">
                  <span>Açıklama</span>
                  <textarea rows="3" value={form.description} onChange={(event) => updateField("description", event.target.value)} />
                </label>
              </div>

              <div className="ren-checks-modal-footer">
                <button type="button" className="ren-checks-secondary" onClick={() => setModalOpen(false)}>
                  Vazgeç
                </button>
                <button type="submit" className="ren-checks-primary">
                  <MdEdit />
                  {editingId ? "Güncelle" : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
