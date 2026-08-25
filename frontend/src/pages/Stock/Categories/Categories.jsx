import React, { useEffect, useMemo, useState } from "react";
import "./Categories.css";

const STORAGE_KEY = "ren_erp_categories";

const DEFAULT_CATEGORIES = [
  {
    id: 1,
    name: "Temizlik Ürünleri",
    description: "Genel temizlik ve hijyen ürünleri",
    status: "Aktif",
  },
  {
    id: 2,
    name: "Kağıt Ürünleri",
    description: "Tuvalet kağıdı, havlu ve peçete ürünleri",
    status: "Aktif",
  },
  {
    id: 3,
    name: "Ambalaj",
    description: "Poşet, bardak, kap ve ambalaj ürünleri",
    status: "Aktif",
  },
  {
    id: 4,
    name: "Deterjan",
    description: "Profesyonel ve ev tipi deterjanlar",
    status: "Aktif",
  },
  {
    id: 5,
    name: "Temizlik Ekipmanları",
    description: "Mop, fırça, süpürge ve ekipmanlar",
    status: "Aktif",
  },
];

function Categories() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "Aktif",
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        setCategories(JSON.parse(saved));
      } catch {
        setCategories(DEFAULT_CATEGORIES);
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(DEFAULT_CATEGORIES)
        );
      }
    } else {
      setCategories(DEFAULT_CATEGORIES);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(DEFAULT_CATEGORIES)
      );
    }
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    }
  }, [categories]);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr-TR");

    if (!query) return categories;

    return categories.filter((category) => {
      return (
        category.name.toLocaleLowerCase("tr-TR").includes(query) ||
        category.description
          .toLocaleLowerCase("tr-TR")
          .includes(query)
      );
    });
  }, [categories, search]);

  const openNewModal = () => {
    setEditingCategory(null);
    setForm({
      name: "",
      description: "",
      status: "Aktif",
    });
    setShowModal(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);

    setForm({
      name: category.name,
      description: category.description || "",
      status: category.status || "Aktif",
    });

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);

    setForm({
      name: "",
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

    const categoryName = form.name.trim();

    if (!categoryName) {
      alert("Kategori adı boş bırakılamaz.");
      return;
    }

    const duplicate = categories.some(
      (category) =>
        category.name
          .trim()
          .toLocaleLowerCase("tr-TR") ===
          categoryName.toLocaleLowerCase("tr-TR") &&
        category.id !== editingCategory?.id
    );

    if (duplicate) {
      alert("Bu kategori zaten mevcut.");
      return;
    }

    if (editingCategory) {
      setCategories((prev) =>
        prev.map((category) =>
          category.id === editingCategory.id
            ? {
                ...category,
                name: categoryName,
                description: form.description.trim(),
                status: form.status,
              }
            : category
        )
      );
    } else {
      const newCategory = {
        id: Date.now(),
        name: categoryName,
        description: form.description.trim(),
        status: form.status,
      };

      setCategories((prev) => [newCategory, ...prev]);
    }

    closeModal();
  };

  const handleDelete = (category) => {
    const confirmed = window.confirm(
      `"${category.name}" kategorisini silmek istediğinize emin misiniz?`
    );

    if (!confirmed) return;

    setCategories((prev) =>
      prev.filter((item) => item.id !== category.id)
    );
  };

  return (
    <div className="categories-page">
      <div className="categories-header">
        <div>
          <div className="breadcrumb">
            Stok <span>/</span> Kategoriler
          </div>

          <h1>Kategoriler</h1>

          <p>
            Ürün kategorilerinizi buradan yönetin.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openNewModal}
        >
          <span>+</span>
          Yeni Kategori
        </button>
      </div>

      <div className="categories-toolbar">
        <div className="search-box">
          <span className="search-icon">⌕</span>

          <input
            type="text"
            placeholder="Kategori ara..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="category-count">
          <strong>{filteredCategories.length}</strong>
          <span>Kategori</span>
        </div>
      </div>

      <div className="categories-card">
        <div className="table-header">
          <div>KATEGORİ</div>
          <div>AÇIKLAMA</div>
          <div>ÜRÜN SAYISI</div>
          <div>DURUM</div>
          <div>İŞLEMLER</div>
        </div>

        {filteredCategories.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">▦</div>

            <h3>Kategori bulunamadı</h3>

            <p>
              Arama kriterlerinize uygun kategori bulunmuyor.
            </p>

            <button
              type="button"
              className="secondary-button"
              onClick={openNewModal}
            >
              Yeni Kategori Ekle
            </button>
          </div>
        ) : (
          filteredCategories.map((category) => (
            <div
              className="category-row"
              key={category.id}
            >
              <div className="category-name-cell">
                <div className="category-icon">
                  #
                </div>

                <div>
                  <strong>{category.name}</strong>

                  <small>
                    Kategori #{category.id}
                  </small>
                </div>
              </div>

              <div className="description-cell">
                {category.description || "-"}
              </div>

              <div className="product-count">
                0 <span>ürün</span>
              </div>

              <div>
                <span
                  className={`status-badge ${
                    category.status === "Aktif"
                      ? "active"
                      : "passive"
                  }`}
                >
                  <span className="status-dot" />
                  {category.status}
                </span>
              </div>

              <div className="actions">
                <button
                  type="button"
                  className="edit-button"
                  onClick={() =>
                    openEditModal(category)
                  }
                  title="Düzenle"
                >
                  ✎
                </button>

                <button
                  type="button"
                  className="delete-button"
                  onClick={() =>
                    handleDelete(category)
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
            className="category-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <span className="modal-icon">
                  #
                </span>

                <div>
                  <h2>
                    {editingCategory
                      ? "Kategori Düzenle"
                      : "Yeni Kategori"}
                  </h2>

                  <p>
                    {editingCategory
                      ? "Kategori bilgilerini güncelleyin."
                      : "Yeni bir ürün kategorisi oluşturun."}
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
              className="category-form"
              onSubmit={handleSubmit}
            >
              <div className="form-group">
                <label>
                  Kategori Adı
                  <span>*</span>
                </label>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Örn. Temizlik Ürünleri"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Açıklama</label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Kategori hakkında kısa açıklama..."
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>Durum</label>

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
                  {editingCategory
                    ? "Değişiklikleri Kaydet"
                    : "Kategori Oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Categories;