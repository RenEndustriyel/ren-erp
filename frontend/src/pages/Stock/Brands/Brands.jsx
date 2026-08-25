import React, { useEffect, useMemo, useState } from "react";
import "./Brands.css";

const STORAGE_KEY = "ren_erp_brands";

const DEFAULT_BRANDS = [
  {
    id: 1,
    name: "Domestos",
    description: "Profesyonel ve genel temizlik ürünleri",
    status: "Aktif",
  },
  {
    id: 2,
    name: "Bingo",
    description: "Çamaşır ve genel temizlik ürünleri",
    status: "Aktif",
  },
  {
    id: 3,
    name: "Selpak",
    description: "Kağıt ve hijyen ürünleri",
    status: "Aktif",
  },
  {
    id: 4,
    name: "Cif",
    description: "Yüzey ve genel temizlik ürünleri",
    status: "Aktif",
  },
  {
    id: 5,
    name: "Unilever Professional",
    description: "Profesyonel işletme temizlik ürünleri",
    status: "Aktif",
  },
  {
    id: 6,
    name: "Tex",
    description: "Endüstriyel temizlik ürünleri",
    status: "Aktif",
  },
];

export default function Brands() {
  const [brands, setBrands] = useState([]);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [editingBrand, setEditingBrand] =
    useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "Aktif",
  });

  useEffect(() => {
    const saved =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (saved) {
      try {
        setBrands(
          JSON.parse(saved)
        );
      } catch {
        setBrands(DEFAULT_BRANDS);

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(
            DEFAULT_BRANDS
          )
        );
      }
    } else {
      setBrands(DEFAULT_BRANDS);

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          DEFAULT_BRANDS
        )
      );
    }
  }, []);

  useEffect(() => {
    if (brands.length > 0) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(brands)
      );
    }
  }, [brands]);

  const filteredBrands =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLocaleLowerCase(
            "tr-TR"
          );

      if (!query) {
        return brands;
      }

      return brands.filter(
        (brand) =>
          brand.name
            .toLocaleLowerCase(
              "tr-TR"
            )
            .includes(query) ||
          brand.description
            .toLocaleLowerCase(
              "tr-TR"
            )
            .includes(query)
      );
    }, [brands, search]);

  const openNewModal = () => {
    setEditingBrand(null);

    setForm({
      name: "",
      description: "",
      status: "Aktif",
    });

    setShowModal(true);
  };

  const openEditModal = (
    brand
  ) => {
    setEditingBrand(brand);

    setForm({
      name: brand.name,
      description:
        brand.description || "",
      status:
        brand.status || "Aktif",
    });

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBrand(null);

    setForm({
      name: "",
      description: "",
      status: "Aktif",
    });
  };

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (
    event
  ) => {
    event.preventDefault();

    const brandName =
      form.name.trim();

    if (!brandName) {
      alert(
        "Marka adı boş bırakılamaz."
      );

      return;
    }

    const duplicate =
      brands.some(
        (brand) =>
          brand.name
            .trim()
            .toLocaleLowerCase(
              "tr-TR"
            ) ===
            brandName.toLocaleLowerCase(
              "tr-TR"
            ) &&
          brand.id !==
            editingBrand?.id
      );

    if (duplicate) {
      alert(
        "Bu marka zaten mevcut."
      );

      return;
    }

    if (editingBrand) {
      setBrands((prev) =>
        prev.map((brand) =>
          brand.id ===
          editingBrand.id
            ? {
                ...brand,
                name: brandName,
                description:
                  form.description.trim(),
                status:
                  form.status,
              }
            : brand
        )
      );
    } else {
      const newBrand = {
        id: Date.now(),
        name: brandName,
        description:
          form.description.trim(),
        status: form.status,
      };

      setBrands((prev) => [
        newBrand,
        ...prev,
      ]);
    }

    closeModal();
  };

  const handleDelete = (
    brand
  ) => {
    const confirmed =
      window.confirm(
        `"${brand.name}" markasını silmek istediğinize emin misiniz?`
      );

    if (!confirmed) {
      return;
    }

    setBrands((prev) =>
      prev.filter(
        (item) =>
          item.id !== brand.id
      )
    );
  };

  return (
    <div className="brands-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="brands-header">

        <div>

          <div className="breadcrumb">
            Stok
            <span>/</span>
            Markalar
          </div>

          <h1>
            Markalar
          </h1>

          <p>
            Ürün markalarınızı
            buradan yönetin.
          </p>

        </div>

        <button
          type="button"
          className="primary-button"
          onClick={
            openNewModal
          }
        >
          <span>+</span>

          Yeni Marka
        </button>

      </div>

      {/* =================================================
          TOOLBAR
      ================================================= */}

      <div className="brands-toolbar">

        <div className="search-box">

          <span className="search-icon">
            ⌕
          </span>

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Marka ara..."
          />

        </div>

        <div className="brand-count">

          <strong>
            {
              filteredBrands.length
            }
          </strong>

          <span>
            Marka
          </span>

        </div>

      </div>

      {/* =================================================
          TABLE
      ================================================= */}

      <div className="brands-card">

        <div className="table-header">

          <div>
            MARKA
          </div>

          <div>
            AÇIKLAMA
          </div>

          <div>
            ÜRÜN SAYISI
          </div>

          <div>
            DURUM
          </div>

          <div>
            İŞLEMLER
          </div>

        </div>

        {filteredBrands.length ===
        0 ? (
          <div className="empty-state">

            <div className="empty-icon">
              B
            </div>

            <h3>
              Marka bulunamadı
            </h3>

            <p>
              Arama kriterlerinize
              uygun marka bulunmuyor.
            </p>

            <button
              type="button"
              className="secondary-button"
              onClick={
                openNewModal
              }
            >
              Yeni Marka Ekle
            </button>

          </div>
        ) : (
          filteredBrands.map(
            (brand) => (
              <div
                className="brand-row"
                key={brand.id}
              >

                <div className="brand-name-cell">

                  <div className="brand-icon">
                    {brand.name
                      .charAt(0)
                      .toLocaleUpperCase(
                        "tr-TR"
                      )}
                  </div>

                  <div>

                    <strong>
                      {brand.name}
                    </strong>

                    <small>
                      Marka #
                      {brand.id}
                    </small>

                  </div>

                </div>

                <div className="description-cell">
                  {
                    brand.description ||
                    "-"
                  }
                </div>

                <div className="product-count">
                  0{" "}
                  <span>
                    ürün
                  </span>
                </div>

                <div>

                  <span
                    className={`status-badge ${
                      brand.status ===
                      "Aktif"
                        ? "active"
                        : "passive"
                    }`}
                  >
                    <span className="status-dot" />

                    {
                      brand.status
                    }

                  </span>

                </div>

                <div className="actions">

                  <button
                    type="button"
                    className="edit-button"
                    onClick={() =>
                      openEditModal(
                        brand
                      )
                    }
                    title="Düzenle"
                  >
                    ✎
                  </button>

                  <button
                    type="button"
                    className="delete-button"
                    onClick={() =>
                      handleDelete(
                        brand
                      )
                    }
                    title="Sil"
                  >
                    🗑
                  </button>

                </div>

              </div>
            )
          )
        )}

      </div>

      {/* =================================================
          MODAL
      ================================================= */}

      {showModal && (
        <div
          className="modal-overlay"
          onMouseDown={
            closeModal
          }
        >

          <div
            className="brand-modal"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <span className="modal-icon">
                  B
                </span>

                <div>

                  <h2>
                    {editingBrand
                      ? "Marka Düzenle"
                      : "Yeni Marka"}
                  </h2>

                  <p>
                    {editingBrand
                      ? "Marka bilgilerini güncelleyin."
                      : "Yeni bir ürün markası oluşturun."}
                  </p>

                </div>

              </div>

              <button
                type="button"
                className="close-button"
                onClick={
                  closeModal
                }
              >
                ×
              </button>

            </div>

            <form
              className="brand-form"
              onSubmit={
                handleSubmit
              }
            >

              <div className="form-group">

                <label>
                  Marka Adı
                  <span>
                    *
                  </span>
                </label>

                <input
                  name="name"
                  value={form.name}
                  onChange={
                    handleChange
                  }
                  placeholder="Örn. Domestos"
                  autoFocus
                />

              </div>

              <div className="form-group">

                <label>
                  Açıklama
                </label>

                <textarea
                  name="description"
                  value={
                    form.description
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Marka hakkında kısa açıklama..."
                  rows="4"
                />

              </div>

              <div className="form-group">

                <label>
                  Durum
                </label>

                <select
                  name="status"
                  value={
                    form.status
                  }
                  onChange={
                    handleChange
                  }
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
                  onClick={
                    closeModal
                  }
                >
                  Vazgeç
                </button>

                <button
                  type="submit"
                  className="save-button"
                >
                  {editingBrand
                    ? "Değişiklikleri Kaydet"
                    : "Marka Oluştur"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}