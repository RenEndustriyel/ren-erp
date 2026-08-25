import React, { useEffect, useMemo, useState } from "react";
import "./Units.css";

const STORAGE_KEY = "ren_erp_units";

const DEFAULT_UNITS = [
  {
    id: 1,
    name: "Adet",
    shortName: "Ad",
    description: "Tekli ürünler için kullanılır.",
    status: "Aktif",
  },
  {
    id: 2,
    name: "Koli",
    shortName: "Koli",
    description: "Koli bazında satılan ürünler için kullanılır.",
    status: "Aktif",
  },
  {
    id: 3,
    name: "Paket",
    shortName: "Pkt",
    description: "Paket halinde satılan ürünler için kullanılır.",
    status: "Aktif",
  },
  {
    id: 4,
    name: "Kilogram",
    shortName: "Kg",
    description: "Kilogram üzerinden ölçülen ürünler.",
    status: "Aktif",
  },
  {
    id: 5,
    name: "Gram",
    shortName: "Gr",
    description: "Gram üzerinden ölçülen ürünler.",
    status: "Aktif",
  },
  {
    id: 6,
    name: "Litre",
    shortName: "Lt",
    description: "Litre üzerinden ölçülen sıvı ürünler.",
    status: "Aktif",
  },
  {
    id: 7,
    name: "Mililitre",
    shortName: "Ml",
    description: "Mililitre üzerinden ölçülen sıvı ürünler.",
    status: "Aktif",
  },
  {
    id: 8,
    name: "Metre",
    shortName: "Mt",
    description: "Metre üzerinden ölçülen ürünler.",
    status: "Aktif",
  },
  {
    id: 9,
    name: "Çift",
    shortName: "Çift",
    description: "Çift olarak satılan ürünler.",
    status: "Aktif",
  },
];

export default function Units() {
  const [units, setUnits] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);

  const [form, setForm] = useState({
    name: "",
    shortName: "",
    description: "",
    status: "Aktif",
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        setUnits(JSON.parse(saved));
      } catch {
        setUnits(DEFAULT_UNITS);

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(DEFAULT_UNITS)
        );
      }
    } else {
      setUnits(DEFAULT_UNITS);

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(DEFAULT_UNITS)
      );
    }
  }, []);

  useEffect(() => {
    if (units.length > 0) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(units)
      );
    }
  }, [units]);

  const filteredUnits = useMemo(() => {
    const query = search
      .trim()
      .toLocaleLowerCase("tr-TR");

    if (!query) {
      return units;
    }

    return units.filter(
      (unit) =>
        unit.name
          .toLocaleLowerCase("tr-TR")
          .includes(query) ||
        unit.shortName
          .toLocaleLowerCase("tr-TR")
          .includes(query) ||
        unit.description
          .toLocaleLowerCase("tr-TR")
          .includes(query)
    );
  }, [units, search]);

  const openNewModal = () => {
    setEditingUnit(null);

    setForm({
      name: "",
      shortName: "",
      description: "",
      status: "Aktif",
    });

    setShowModal(true);
  };

  const openEditModal = (unit) => {
    setEditingUnit(unit);

    setForm({
      name: unit.name,
      shortName: unit.shortName || "",
      description: unit.description || "",
      status: unit.status || "Aktif",
    });

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUnit(null);

    setForm({
      name: "",
      shortName: "",
      description: "",
      status: "Aktif",
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const unitName = form.name.trim();
    const shortName = form.shortName.trim();

    if (!unitName) {
      alert("Birim adı boş bırakılamaz.");
      return;
    }

    if (!shortName) {
      alert("Kısa birim adı boş bırakılamaz.");
      return;
    }

    const duplicate = units.some(
      (unit) =>
        unit.name
          .trim()
          .toLocaleLowerCase("tr-TR") ===
          unitName.toLocaleLowerCase("tr-TR") &&
        unit.id !== editingUnit?.id
    );

    if (duplicate) {
      alert("Bu birim zaten mevcut.");
      return;
    }

    if (editingUnit) {
      setUnits((prev) =>
        prev.map((unit) =>
          unit.id === editingUnit.id
            ? {
                ...unit,
                name: unitName,
                shortName,
                description: form.description.trim(),
                status: form.status,
              }
            : unit
        )
      );
    } else {
      const newUnit = {
        id: Date.now(),
        name: unitName,
        shortName,
        description: form.description.trim(),
        status: form.status,
      };

      setUnits((prev) => [
        newUnit,
        ...prev,
      ]);
    }

    closeModal();
  };

  const handleDelete = (unit) => {
    const confirmed = window.confirm(
      `"${unit.name}" birimini silmek istediğinize emin misiniz?`
    );

    if (!confirmed) {
      return;
    }

    setUnits((prev) =>
      prev.filter(
        (item) => item.id !== unit.id
      )
    );
  };

  return (
    <div className="units-page">

      <div className="units-header">

        <div>

          <div className="breadcrumb">
            Stok
            <span>/</span>
            Birimler
          </div>

          <h1>Birimler</h1>

          <p>
            Ürünlerde kullanılacak ölçü
            ve satış birimlerini yönetin.
          </p>

        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openNewModal}
        >
          <span>+</span>
          Yeni Birim
        </button>

      </div>

      <div className="units-toolbar">

        <div className="search-box">

          <span className="search-icon">
            ⌕
          </span>

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Birim ara..."
          />

        </div>

        <div className="unit-count">

          <strong>
            {filteredUnits.length}
          </strong>

          <span>
            Birim
          </span>

        </div>

      </div>

      <div className="units-card">

        <div className="table-header">

          <div>BİRİM</div>
          <div>KISA AD</div>
          <div>AÇIKLAMA</div>
          <div>ÜRÜN SAYISI</div>
          <div>DURUM</div>
          <div>İŞLEMLER</div>

        </div>

        {filteredUnits.length === 0 ? (
          <div className="empty-state">

            <div className="empty-icon">
              U
            </div>

            <h3>
              Birim bulunamadı
            </h3>

            <p>
              Arama kriterlerinize
              uygun birim bulunmuyor.
            </p>

            <button
              type="button"
              className="secondary-button"
              onClick={openNewModal}
            >
              Yeni Birim Ekle
            </button>

          </div>
        ) : (
          filteredUnits.map((unit) => (

            <div
              className="unit-row"
              key={unit.id}
            >

              <div className="unit-name-cell">

                <div className="unit-icon">
                  {unit.shortName
                    .charAt(0)
                    .toLocaleUpperCase("tr-TR")}
                </div>

                <div>

                  <strong>
                    {unit.name}
                  </strong>

                  <small>
                    Birim #{unit.id}
                  </small>

                </div>

              </div>

              <div>
                <span className="short-name">
                  {unit.shortName}
                </span>
              </div>

              <div className="description-cell">
                {unit.description || "-"}
              </div>

              <div className="product-count">
                0
                <span> ürün</span>
              </div>

              <div>

                <span
                  className={
                    unit.status === "Aktif"
                      ? "status-badge active"
                      : "status-badge passive"
                  }
                >
                  <i className="status-dot" />
                  {unit.status}
                </span>

              </div>

              <div className="actions">

                <button
                  type="button"
                  className="edit-button"
                  onClick={() =>
                    openEditModal(unit)
                  }
                  title="Düzenle"
                >
                  ✎
                </button>

                <button
                  type="button"
                  className="delete-button"
                  onClick={() =>
                    handleDelete(unit)
                  }
                  title="Sil"
                >
                  🗑
                </button>

              </div>

            </div>

          ))
        )}

      </div>

      {showModal && (

        <div
          className="modal-overlay"
          onMouseDown={closeModal}
        >

          <div
            className="unit-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <span className="modal-icon">
                  U
                </span>

                <div>

                  <h2>
                    {editingUnit
                      ? "Birim Düzenle"
                      : "Yeni Birim"}
                  </h2>

                  <p>
                    {editingUnit
                      ? "Birim bilgilerini güncelleyin."
                      : "Yeni bir ürün birimi oluşturun."}
                  </p>

                </div>

              </div>

              <button
                type="button"
                className="close-button"
                onClick={closeModal}
              >
                ×
              </button>

            </div>

            <form
              className="unit-form"
              onSubmit={handleSubmit}
            >

              <div className="form-row">

                <div className="form-group">

                  <label>
                    Birim Adı
                    <span>*</span>
                  </label>

                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Örn. Adet"
                    autoFocus
                  />

                </div>

                <div className="form-group">

                  <label>
                    Kısa Ad
                    <span>*</span>
                  </label>

                  <input
                    name="shortName"
                    value={form.shortName}
                    onChange={handleChange}
                    placeholder="Örn. Ad"
                  />

                </div>

              </div>

              <div className="form-group">

                <label>
                  Açıklama
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Birim hakkında kısa açıklama..."
                  rows="4"
                />

              </div>

              <div className="form-group">

                <label>
                  Durum
                </label>

                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="Aktif">
                    Aktif
                  </option>

                  <option value="Pasif">
                    Pasif
                  </option>
                </select>

              </div>

              <div className="modal-footer">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeModal}
                >
                  Vazgeç
                </button>

                <button
                  type="submit"
                  className="save-button"
                >
                  {editingUnit
                    ? "Değişiklikleri Kaydet"
                    : "Birim Oluştur"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}