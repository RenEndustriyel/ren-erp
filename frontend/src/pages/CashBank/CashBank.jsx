import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "./CashBank.css";

const ACCOUNT_STORAGE_KEY =
  "ren-erp-cash-bank-accounts";

const MOVEMENT_STORAGE_KEY =
  "ren-erp-cash-bank-movements";

const defaultAccounts = [
  {
    id: 1,
    name: "Ana Kasa",
    type: "Kasa",
    bank: "",
    iban: "",
    balance: 0,
    status: "Aktif",
  },
  {
    id: 2,
    name: "Ziraat Bankası",
    type: "Banka",
    bank: "Ziraat Bankası",
    iban: "",
    balance: 0,
    status: "Aktif",
  },
];

function money(value) {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function number(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value)
      ? value
      : 0;
  }

  let text = String(value).trim();

  if (
    text.includes(",") &&
    text.includes(".")
  ) {
    text = text
      .replace(/\./g, "")
      .replace(",", ".");
  } else {
    text = text.replace(",", ".");
  }

  const parsed = Number(text);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function normalizeAccountType(
  account
) {
  if (!account) {
    return "Banka";
  }

  const currentType =
    String(
      account.type || ""
    ).trim();

  const name =
    String(
      account.name || ""
    ).toLocaleLowerCase(
      "tr-TR"
    );

  const bank =
    String(
      account.bank || ""
    ).toLocaleLowerCase(
      "tr-TR"
    );

  const combined =
    `${name} ${bank}`
      .toLocaleLowerCase(
        "tr-TR"
      );

  /*
    Eski kayıtlarda POS hesapları
    yanlışlıkla "Banka" olarak tutulmuşsa
    otomatik olarak POS'a çeviriyoruz.
  */
  if (
    currentType === "POS" ||
    combined.includes("pos")
  ) {
    return "POS";
  }

  if (
    currentType === "Kasa"
  ) {
    return "Kasa";
  }

  return "Banka";
}

function normalizeAccounts(
  accounts
) {
  if (
    !Array.isArray(accounts)
  ) {
    return [];
  }

  return accounts.map(
    (account) => ({
      ...account,
      type:
        normalizeAccountType(
          account
        ),
      balance:
        number(
          account.balance
        ),
      status:
        account.status ||
        "Aktif",
    })
  );
}

function readAccounts() {
  try {
    const saved =
      localStorage.getItem(
        ACCOUNT_STORAGE_KEY
      );

    if (saved) {
      const parsed =
        JSON.parse(saved);

      if (
        Array.isArray(parsed)
      ) {
        return normalizeAccounts(
          parsed
        );
      }
    }
  } catch (error) {
    console.error(
      "REN ERP hesapları okunamadı:",
      error
    );
  }

  return defaultAccounts;
}

function readMovements() {
  try {
    const saved =
      localStorage.getItem(
        MOVEMENT_STORAGE_KEY
      );

    if (saved) {
      const parsed =
        JSON.parse(saved);

      if (
        Array.isArray(parsed)
      ) {
        return parsed;
      }
    }
  } catch (error) {
    console.error(
      "REN ERP finans hareketleri okunamadı:",
      error
    );
  }

  return [];
}

function saveAccounts(
  accounts
) {
  localStorage.setItem(
    ACCOUNT_STORAGE_KEY,
    JSON.stringify(
      normalizeAccounts(
        accounts
      )
    )
  );

  window.dispatchEvent(
    new Event(
      "ren-cash-bank-updated"
    )
  );
}

function saveMovements(
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
      "ren-cash-bank-updated"
    )
  );
}

function accountIcon(
  type
) {
  if (type === "POS") {
    return "▣";
  }

  if (type === "Banka") {
    return "₺";
  }

  return "▤";
}

export default function CashBank() {
  const [
    accounts,
    setAccounts,
  ] = useState(
    readAccounts
  );

  const [
    movements,
    setMovements,
  ] = useState(
    readMovements
  );

  const [
    activeTab,
    setActiveTab,
  ] = useState(
    "accounts"
  );

  const [
    showAccountModal,
    setShowAccountModal,
  ] = useState(
    false
  );

  const [
    showMovementModal,
    setShowMovementModal,
  ] = useState(
    false
  );

  const [
    editingAccount,
    setEditingAccount,
  ] = useState(
    null
  );

  const [
    accountForm,
    setAccountForm,
  ] = useState({
    name: "",
    type: "Banka",
    bank: "",
    iban: "",
    openingBalance: "",
  });

  const [
    movementForm,
    setMovementForm,
  ] = useState({
    accountId: "",
    direction: "Giriş",
    amount: "",
    description: "",
    date:
      new Date()
        .toISOString()
        .slice(0, 10),
    method: "Nakit",
  });

  /* =====================================================
     VERİLERİ YENİLE
  ===================================================== */

  const refreshData = () => {
    const normalized =
      readAccounts();

    setAccounts(
      normalized
    );

    /*
      Eski kayıtların türleri yanlışsa
      bir kez kalıcı olarak düzelt.
    */
    localStorage.setItem(
      ACCOUNT_STORAGE_KEY,
      JSON.stringify(
        normalized
      )
    );

    setMovements(
      readMovements()
    );
  };

  useEffect(() => {
    refreshData();

    const events = [
      "ren-cash-bank-updated",
      "ren-invoices-updated",
      "ren-finance-updated",
      "ren-customers-updated",
      "ren-stock-updated",
    ];

    events.forEach(
      (eventName) => {
        window.addEventListener(
          eventName,
          refreshData
        );
      }
    );

    return () => {
      events.forEach(
        (eventName) => {
          window.removeEventListener(
            eventName,
            refreshData
          );
        }
      );
    };
  }, []);

  /* =====================================================
     ÖZETLER
  ===================================================== */

  const totalCash =
    useMemo(() => {
      return accounts
        .filter(
          (account) =>
            normalizeAccountType(
              account
            ) === "Kasa"
        )
        .reduce(
          (
            total,
            account
          ) =>
            total +
            number(
              account.balance
            ),
          0
        );
    }, [accounts]);

  const totalBank =
    useMemo(() => {
      return accounts
        .filter(
          (account) =>
            normalizeAccountType(
              account
            ) === "Banka"
        )
        .reduce(
          (
            total,
            account
          ) =>
            total +
            number(
              account.balance
            ),
          0
        );
    }, [accounts]);

  const totalPos =
    useMemo(() => {
      return accounts
        .filter(
          (account) =>
            normalizeAccountType(
              account
            ) === "POS"
        )
        .reduce(
          (
            total,
            account
          ) =>
            total +
            number(
              account.balance
            ),
          0
        );
    }, [accounts]);

  const totalLiquidity =
    totalCash +
    totalBank +
    totalPos;

  /* =====================================================
     FORM TEMİZLE
  ===================================================== */

  const resetAccountForm =
    () => {
      setAccountForm({
        name: "",
        type: "Banka",
        bank: "",
        iban: "",
        openingBalance: "",
      });

      setEditingAccount(
        null
      );
    };

  /* =====================================================
     YENİ HESAP
  ===================================================== */

  const openNewAccount =
    () => {
      resetAccountForm();
      setShowAccountModal(
        true
      );
    };

  /* =====================================================
     DÜZENLE
  ===================================================== */

  const openEditAccount =
    (account) => {
      setEditingAccount(
        account
      );

      setAccountForm({
        name:
          account.name || "",
        type:
          normalizeAccountType(
            account
          ),
        bank:
          account.bank || "",
        iban:
          account.iban || "",
        openingBalance:
          account.balance ?? "",
      });

      setShowAccountModal(
        true
      );
    };

  /* =====================================================
     HESAP KAYDET
  ===================================================== */

  const handleAccountSubmit =
    (event) => {
      event.preventDefault();

      const name =
        accountForm.name.trim();

      if (!name) {
        alert(
          "Hesap adı zorunludur."
        );
        return;
      }

      const balance =
        number(
          accountForm.openingBalance
        );

      if (
        editingAccount
      ) {
        const updated =
          accounts.map(
            (account) => {
              if (
                String(
                  account.id
                ) !==
                String(
                  editingAccount.id
                )
              ) {
                return account;
              }

              return {
                ...account,
                name,
                type:
                  accountForm.type,
                bank:
                  accountForm.bank.trim(),
                iban:
                  accountForm.iban.trim(),
                balance,
              };
            }
          );

        saveAccounts(
          updated
        );

        setAccounts(
          normalizeAccounts(
            updated
          )
        );
      } else {
        const newAccount = {
          id:
            Date.now() +
            Math.random(),

          name,

          type:
            accountForm.type,

          bank:
            accountForm.bank.trim(),

          iban:
            accountForm.iban.trim(),

          balance,

          status:
            "Aktif",
        };

        const updated = [
          ...accounts,
          newAccount,
        ];

        saveAccounts(
          updated
        );

        setAccounts(
          normalizeAccounts(
            updated
          )
        );
      }

      resetAccountForm();
      setShowAccountModal(
        false
      );
    };

  /* =====================================================
     HESAP SİL
  ===================================================== */

  const deleteAccount =
    (accountId) => {
      const account =
        accounts.find(
          (item) =>
            String(
              item.id
            ) ===
            String(
              accountId
            )
        );

      if (!account) {
        return;
      }

      if (
        number(
          account.balance
        ) !== 0
      ) {
        alert(
          "Bakiyesi olan hesap silinemez. Önce hesabın bakiyesini sıfırlayın."
        );

        return;
      }

      const hasMovement =
        movements.some(
          (movement) =>
            String(
              movement.accountId
            ) ===
            String(
              accountId
            )
        );

      if (
        hasMovement
      ) {
        alert(
          "Bu hesaba ait finans hareketleri bulunduğu için hesap silinemez."
        );

        return;
      }

      const confirmed =
        window.confirm(
          `${account.name} hesabını silmek istediğinize emin misiniz?`
        );

      if (!confirmed) {
        return;
      }

      const updated =
        accounts.filter(
          (item) =>
            String(
              item.id
            ) !==
            String(
              accountId
            )
        );

      saveAccounts(
        updated
      );

      setAccounts(
        normalizeAccounts(
          updated
        )
      );
    };

  /* =====================================================
     HAREKET KAYDET
  ===================================================== */

  const handleMovementSubmit =
    (event) => {
      event.preventDefault();

      const account =
        accounts.find(
          (item) =>
            String(
              item.id
            ) ===
            String(
              movementForm.accountId
            )
        );

      const amount =
        number(
          movementForm.amount
        );

      if (!account) {
        alert(
          "Hesap seçiniz."
        );
        return;
      }

      if (amount <= 0) {
        alert(
          "Geçerli bir tutar giriniz."
        );
        return;
      }

      const signedAmount =
        movementForm.direction ===
        "Giriş"
          ? amount
          : -amount;

      const updatedAccounts =
        accounts.map(
          (item) => {
            if (
              String(
                item.id
              ) !==
              String(
                account.id
              )
            ) {
              return item;
            }

            return {
              ...item,

              balance:
                number(
                  item.balance
                ) +
                signedAmount,
            };
          }
        );

      const movement = {
        id:
          `CB-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 7)}`,

        accountId:
          account.id,

        accountName:
          account.name,

        accountType:
          normalizeAccountType(
            account
          ),

        direction:
          movementForm.direction,

        amount,

        description:
          movementForm.description ||
          "Manuel finans hareketi",

        date:
          movementForm.date,

        method:
          movementForm.method,

        source:
          "manual",

        createdAt:
          new Date().toISOString(),
      };

      const updatedMovements =
        [
          movement,
          ...movements,
        ];

      saveAccounts(
        updatedAccounts
      );

      saveMovements(
        updatedMovements
      );

      setAccounts(
        normalizeAccounts(
          updatedAccounts
        )
      );

      setMovements(
        updatedMovements
      );

      setMovementForm({
        accountId: "",
        direction: "Giriş",
        amount: "",
        description: "",
        date:
          new Date()
            .toISOString()
            .slice(0, 10),
        method: "Nakit",
      });

      setShowMovementModal(
        false
      );
    };

  /* =====================================================
     YENİ HAREKET
  ===================================================== */

  const openMovement =
    (
      accountId = ""
    ) => {
      setMovementForm({
        accountId,
        direction: "Giriş",
        amount: "",
        description: "",
        date:
          new Date()
            .toISOString()
            .slice(0, 10),
        method: "Nakit",
      });

      setShowMovementModal(
        true
      );
    };

  return (
    <div className="cash-bank-page">

      <div className="cash-bank-container">

        {/* HEADER */}

        <div className="cash-bank-header">

          <div>

            <div className="cash-bank-breadcrumb">

              <span>
                Kasa - Banka
              </span>

              <span>
                /
              </span>

              <strong>
                Finans
              </strong>

            </div>

            <h1>
              Kasa ve Bankalar
            </h1>

            <p>
              Kasa, banka ve POS hesaplarınızı
              tek ekrandan yönetin.
            </p>

          </div>

          <div className="cash-bank-header-actions">

            <button
              className="cash-bank-secondary-button"
              onClick={
                refreshData
              }
            >
              ↻ Yenile
            </button>

            <button
              className="cash-bank-primary-button"
              onClick={
                openNewAccount
              }
            >
              + Yeni Hesap
            </button>

          </div>

        </div>

        {/* SUMMARY */}

        <div className="cash-bank-summary">

          <div className="cash-bank-summary-card">

            <span>
              TOPLAM KASA
            </span>

            <strong>
              {money(
                totalCash
              )} TL
            </strong>

            <small>
              Tüm kasa hesapları
            </small>

          </div>

          <div className="cash-bank-summary-card">

            <span>
              TOPLAM BANKA
            </span>

            <strong>
              {money(
                totalBank
              )} TL
            </strong>

            <small>
              Tüm banka hesapları
            </small>

          </div>

          <div className="cash-bank-summary-card">

            <span>
              TOPLAM POS
            </span>

            <strong>
              {money(
                totalPos
              )} TL
            </strong>

            <small>
              Kredi kartı / POS
            </small>

          </div>

          <div className="cash-bank-summary-card highlight">

            <span>
              TOPLAM LİKİT VARLIK
            </span>

            <strong>
              {money(
                totalLiquidity
              )} TL
            </strong>

            <small>
              Kasa + banka + POS
            </small>

          </div>

        </div>

        {/* TABS */}

        <div className="cash-bank-tabs">

          <button
            className={
              activeTab ===
              "accounts"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab(
                "accounts"
              )
            }
          >
            Kasa ve Bankalar
          </button>

          <button
            className={
              activeTab ===
              "pos"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab(
                "pos"
              )
            }
          >
            POS / Kredi Kartları
          </button>

          <button
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
            Hareketler
          </button>

        </div>

        {/* HESAPLAR */}

        {activeTab ===
          "accounts" && (

          <div className="cash-bank-card">

            <div className="cash-bank-card-header">

              <div>

                <strong>
                  Kasa ve Banka Hesapları
                </strong>

                <span>
                  Kasa ve banka hesaplarını yönetin.
                </span>

              </div>

              <button
                className="cash-bank-small-primary"
                onClick={
                  openNewAccount
                }
              >
                + Yeni Hesap
              </button>

            </div>

            <div className="cash-bank-account-grid">

              {accounts
                .filter(
                  (account) =>
                    normalizeAccountType(
                      account
                    ) !==
                    "POS"
                )
                .map(
                  (account) => (
                    <div
                      className="cash-bank-account"
                      key={
                        account.id
                      }
                    >

                      <div className="cash-bank-account-top">

                        <div className="cash-bank-account-icon">

                          {
                            accountIcon(
                              normalizeAccountType(
                                account
                              )
                            )
                          }

                        </div>

                        <div>

                          <strong>
                            {
                              account.name
                            }
                          </strong>

                          <span>
                            {
                              normalizeAccountType(
                                account
                              )
                            }

                            {account.bank
                              ? ` • ${account.bank}`
                              : ""}

                          </span>

                        </div>

                      </div>

                      <div className="cash-bank-account-balance">
                        {money(
                          account.balance
                        )} TL
                      </div>

                      {account.iban && (
                        <div className="cash-bank-iban">
                          {account.iban}
                        </div>
                      )}

                      <div className="cash-bank-account-footer">

                        <span className="cash-bank-status">
                          ●{" "}
                          {
                            account.status
                          }
                        </span>

                        <div>

                          <button
                            onClick={() =>
                              openMovement(
                                account.id
                              )
                            }
                          >
                            Hareket
                          </button>

                          <button
                            onClick={() =>
                              openEditAccount(
                                account
                              )
                            }
                          >
                            Düzenle
                          </button>

                          <button
                            className="danger"
                            onClick={() =>
                              deleteAccount(
                                account.id
                              )
                            }
                          >
                            Sil
                          </button>

                        </div>

                      </div>

                    </div>
                  )
                )}

            </div>

          </div>
        )}

        {/* POS */}

        {activeTab ===
          "pos" && (

          <div className="cash-bank-card">

            <div className="cash-bank-card-header">

              <div>

                <strong>
                  POS / Kredi Kartı Hesapları
                </strong>

                <span>
                  POS cihazları ve kartlı tahsilatları
                  yönetin.
                </span>

              </div>

              <button
                className="cash-bank-small-primary"
                onClick={() => {

                  resetAccountForm();

                  setAccountForm({
                    name: "",
                    type: "POS",
                    bank: "",
                    iban: "",
                    openingBalance: "",
                  });

                  setShowAccountModal(
                    true
                  );

                }}
              >
                + POS Hesabı Ekle
              </button>

            </div>

            <div className="cash-bank-account-grid">

              {accounts
                .filter(
                  (account) =>
                    normalizeAccountType(
                      account
                    ) ===
                    "POS"
                )
                .map(
                  (account) => (
                    <div
                      className="cash-bank-account"
                      key={
                        account.id
                      }
                    >

                      <div className="cash-bank-account-top">

                        <div className="cash-bank-account-icon">
                          ▣
                        </div>

                        <div>

                          <strong>
                            {
                              account.name
                            }
                          </strong>

                          <span>
                            POS

                            {account.bank
                              ? ` • ${account.bank}`
                              : ""}
                          </span>

                        </div>

                      </div>

                      <div className="cash-bank-account-balance">
                        {money(
                          account.balance
                        )} TL
                      </div>

                      <div className="cash-bank-account-footer">

                        <span className="cash-bank-status">
                          ●{" "}
                          {
                            account.status
                          }
                        </span>

                        <div>

                          <button
                            onClick={() =>
                              openMovement(
                                account.id
                              )
                            }
                          >
                            Hareket
                          </button>

                          <button
                            onClick={() =>
                              openEditAccount(
                                account
                              )
                            }
                          >
                            Düzenle
                          </button>

                          <button
                            className="danger"
                            onClick={() =>
                              deleteAccount(
                                account.id
                              )
                            }
                          >
                            Sil
                          </button>

                        </div>

                      </div>

                    </div>
                  )
                )}

            </div>

          </div>
        )}

        {/* HAREKETLER */}

        {activeTab ===
          "movements" && (

          <div className="cash-bank-card">

            <div className="cash-bank-card-header">

              <div>

                <strong>
                  Finans Hareketleri
                </strong>

                <span>
                  Kasa, banka ve POS hareketleri.
                </span>

              </div>

              <button
                className="cash-bank-small-primary"
                onClick={() =>
                  openMovement()
                }
              >
                + Yeni Hareket
              </button>

            </div>

            <div className="cash-bank-table-wrapper">

              <table className="cash-bank-table">

                <thead>

                  <tr>

                    <th>
                      TARİH
                    </th>

                    <th>
                      HESAP
                    </th>

                    <th>
                      TÜR
                    </th>

                    <th>
                      AÇIKLAMA
                    </th>

                    <th>
                      YÖNTEM
                    </th>

                    <th>
                      KAYNAK
                    </th>

                    <th>
                      YÖN
                    </th>

                    <th>
                      TUTAR
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {movements.length ===
                  0 ? (

                    <tr>

                      <td
                        colSpan="8"
                        className="cash-bank-empty"
                      >

                        <div>
                          ₺
                        </div>

                        <strong>
                          Henüz hareket yok
                        </strong>

                        <span>
                          Finans hareketleri burada
                          görünecek.
                        </span>

                      </td>

                    </tr>

                  ) : (

                    movements.map(
                      (movement) => (

                        <tr
                          key={
                            movement.id
                          }
                        >

                          <td>
                            {
                              movement.date
                            }
                          </td>

                          <td>
                            <strong>
                              {
                                movement.accountName
                              }
                            </strong>
                          </td>

                          <td>
                            {
                              movement.accountType ||
                              "—"
                            }
                          </td>

                          <td>
                            {
                              movement.description
                            }
                          </td>

                          <td>
                            {
                              movement.method
                            }
                          </td>

                          <td>
                            {
                              movement.source ===
                              "invoice"
                                ? "Fatura"
                                : movement.source ===
                                  "collection"
                                ? "Tahsilat"
                                : movement.source ===
                                  "payment"
                                ? "Ödeme"
                                : "Manuel"
                            }
                          </td>

                          <td>

                            <span
                              className={
                                movement.direction ===
                                "Giriş"
                                  ? "cash-bank-direction income"
                                  : "cash-bank-direction expense"
                              }
                            >
                              {
                                movement.direction
                              }
                            </span>

                          </td>

                          <td className="cash-bank-money">

                            <strong>

                              {movement.direction ===
                              "Giriş"
                                ? "+"
                                : "-"}

                              {" "}

                              {money(
                                movement.amount
                              )}

                              {" TL"}

                            </strong>

                          </td>

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>

          </div>
        )}

      </div>

      {/* ===================================================
          HESAP MODALI
      =================================================== */}

      {showAccountModal && (

        <div
          className="cash-bank-modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {

              setShowAccountModal(
                false
              );

              resetAccountForm();

            }

          }}
        >

          <div className="cash-bank-modal">

            <div className="cash-bank-modal-header">

              <div>

                <strong>
                  {editingAccount
                    ? "Hesabı Düzenle"
                    : "Yeni Hesap"}
                </strong>

                <span>
                  Kasa, banka veya POS hesabı.
                </span>

              </div>

              <button
                type="button"
                onClick={() => {

                  setShowAccountModal(
                    false
                  );

                  resetAccountForm();

                }}
              >
                ×
              </button>

            </div>

            <form
              onSubmit={
                handleAccountSubmit
              }
            >

              <div className="cash-bank-form-group">

                <label>
                  Hesap Adı
                </label>

                <input
                  type="text"
                  value={
                    accountForm.name
                  }
                  onChange={(event) =>
                    setAccountForm(
                      (current) => ({
                        ...current,
                        name:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="Örn. Garanti POS"
                  required
                />

              </div>

              <div className="cash-bank-form-group">

                <label>
                  Hesap Türü
                </label>

                <select
                  value={
                    accountForm.type
                  }
                  onChange={(event) =>
                    setAccountForm(
                      (current) => ({
                        ...current,
                        type:
                          event.target.value,
                      })
                    )
                  }
                >

                  <option value="Kasa">
                    Kasa
                  </option>

                  <option value="Banka">
                    Banka
                  </option>

                  <option value="POS">
                    POS / Kredi Kartı
                  </option>

                </select>

              </div>

              {(accountForm.type ===
                "Banka" ||
                accountForm.type ===
                  "POS") && (

                <>
                  <div className="cash-bank-form-group">

                    <label>
                      Banka / POS Kuruluşu
                    </label>

                    <input
                      type="text"
                      value={
                        accountForm.bank
                      }
                      onChange={(event) =>
                        setAccountForm(
                          (current) => ({
                            ...current,
                            bank:
                              event.target.value,
                          })
                        )
                      }
                      placeholder="Örn. Garanti Bankası"
                    />

                  </div>

                  <div className="cash-bank-form-group">

                    <label>
                      IBAN
                    </label>

                    <input
                      type="text"
                      value={
                        accountForm.iban
                      }
                      onChange={(event) =>
                        setAccountForm(
                          (current) => ({
                            ...current,
                            iban:
                              event.target.value,
                          })
                        )
                      }
                      placeholder="TR00 0000 0000 0000 0000 0000 00"
                    />

                  </div>
                </>

              )}

              <div className="cash-bank-form-group">

                <label>
                  Açılış Bakiyesi
                </label>

                <input
                  type="text"
                  inputMode="decimal"
                  value={
                    accountForm.openingBalance
                  }
                  onChange={(event) =>
                    setAccountForm(
                      (current) => ({
                        ...current,
                        openingBalance:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="0,00"
                />

              </div>

              <div className="cash-bank-modal-footer">

                <button
                  type="button"
                  className="cash-bank-modal-cancel"
                  onClick={() => {

                    setShowAccountModal(
                      false
                    );

                    resetAccountForm();

                  }}
                >
                  Vazgeç
                </button>

                <button
                  type="submit"
                  className="cash-bank-modal-submit"
                >
                  {editingAccount
                    ? "Değişiklikleri Kaydet"
                    : "Hesabı Oluştur"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* ===================================================
          HAREKET MODALI
      =================================================== */}

      {showMovementModal && (

        <div
          className="cash-bank-modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              setShowMovementModal(
                false
              );
            }

          }}
        >

          <div className="cash-bank-modal">

            <div className="cash-bank-modal-header">

              <div>

                <strong>
                  Para Girişi / Çıkışı
                </strong>

                <span>
                  Finans hareketi ekle.
                </span>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowMovementModal(
                    false
                  )
                }
              >
                ×
              </button>

            </div>

            <form
              onSubmit={
                handleMovementSubmit
              }
            >

              <div className="cash-bank-form-group">

                <label>
                  Hesap
                </label>

                <select
                  value={
                    movementForm.accountId
                  }
                  onChange={(event) =>
                    setMovementForm(
                      (current) => ({
                        ...current,
                        accountId:
                          event.target.value,
                      })
                    )
                  }
                  required
                >

                  <option value="">
                    Hesap seçin
                  </option>

                  {accounts.map(
                    (account) => (
                      <option
                        key={
                          account.id
                        }
                        value={
                          account.id
                        }
                      >
                        {account.name} —{" "}
                        {
                          normalizeAccountType(
                            account
                          )
                        }
                      </option>
                    )
                  )}

                </select>

              </div>

              <div className="cash-bank-form-grid">

                <div className="cash-bank-form-group">

                  <label>
                    İşlem
                  </label>

                  <select
                    value={
                      movementForm.direction
                    }
                    onChange={(event) =>
                      setMovementForm(
                        (current) => ({
                          ...current,
                          direction:
                            event.target.value,
                        })
                      )
                    }
                  >

                    <option value="Giriş">
                      Para Girişi
                    </option>

                    <option value="Çıkış">
                      Para Çıkışı
                    </option>

                  </select>

                </div>

                <div className="cash-bank-form-group">

                  <label>
                    Tutar
                  </label>

                  <input
                    type="text"
                    inputMode="decimal"
                    value={
                      movementForm.amount
                    }
                    onChange={(event) =>
                      setMovementForm(
                        (current) => ({
                          ...current,
                          amount:
                            event.target.value,
                        })
                      )
                    }
                    placeholder="0,00"
                    required
                  />

                </div>

              </div>

              <div className="cash-bank-form-grid">

                <div className="cash-bank-form-group">

                  <label>
                    Tarih
                  </label>

                  <input
                    type="date"
                    value={
                      movementForm.date
                    }
                    onChange={(event) =>
                      setMovementForm(
                        (current) => ({
                          ...current,
                          date:
                            event.target.value,
                        })
                      )
                    }
                    required
                  />

                </div>

                <div className="cash-bank-form-group">

                  <label>
                    Ödeme Yöntemi
                  </label>

                  <select
                    value={
                      movementForm.method
                    }
                    onChange={(event) =>
                      setMovementForm(
                        (current) => ({
                          ...current,
                          method:
                            event.target.value,
                        })
                      )
                    }
                  >

                    <option>
                      Nakit
                    </option>

                    <option>
                      Kredi Kartı
                    </option>

                    <option>
                      Banka Transferi
                    </option>

                    <option>
                      Havale / EFT
                    </option>

                    <option>
                      POS
                    </option>

                    <option>
                      Çek
                    </option>

                    <option>
                      Diğer
                    </option>

                  </select>

                </div>

              </div>

              <div className="cash-bank-form-group">

                <label>
                  Açıklama
                </label>

                <textarea
                  value={
                    movementForm.description
                  }
                  onChange={(event) =>
                    setMovementForm(
                      (current) => ({
                        ...current,
                        description:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="İşlem açıklaması..."
                  rows="3"
                />

              </div>

              <div className="cash-bank-modal-footer">

                <button
                  type="button"
                  className="cash-bank-modal-cancel"
                  onClick={() =>
                    setShowMovementModal(
                      false
                    )
                  }
                >
                  Vazgeç
                </button>

                <button
                  type="submit"
                  className="cash-bank-modal-submit"
                >
                  Hareketi Kaydet
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}