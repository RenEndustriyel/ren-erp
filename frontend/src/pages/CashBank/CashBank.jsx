import {
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


/* =========================================================
   YARDIMCI
========================================================= */

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


function number(value) {
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


  const parsed =
    Number(
      text
    );


  return Number.isFinite(
    parsed
  )
    ? parsed
    : 0;
}


function readAccounts() {

  try {

    const saved =
      localStorage.getItem(
        ACCOUNT_STORAGE_KEY
      );


    if (
      saved
    ) {

      const parsed =
        JSON.parse(
          saved
        );


      if (
        Array.isArray(
          parsed
        )
      ) {
        return parsed;
      }

    }

  } catch (
    error
  ) {

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


    if (
      saved
    ) {

      const parsed =
        JSON.parse(
          saved
        );


      if (
        Array.isArray(
          parsed
        )
      ) {
        return parsed;
      }

    }

  } catch (
    error
  ) {

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
      accounts
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

  if (
    type ===
    "POS"
  ) {
    return "▣";
  }

  if (
    type ===
    "Banka"
  ) {
    return "₺";
  }

  return "▤";

}


function signedAmount(
  movement
) {

  const amount =
    number(
      movement.amount
    );


  return movement.direction ===
    "Giriş"
    ? amount
    : -amount;

}


function formatDate(
  value
) {

  if (!value) {
    return "—";
  }


  const text =
    String(
      value
    );


  const date =
    new Date(
      /^\d{4}-\d{2}-\d{2}$/.test(
        text
      )
        ? `${text}T12:00:00`
        : text
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return text;
  }


  return new Intl.DateTimeFormat(
    "tr-TR"
  ).format(
    date
  );

}


function sourceLabel(
  source
) {

  switch (
    String(
      source ||
      ""
    ).toLowerCase()
  ) {

    case "invoice":
      return "Fatura";

    case "collection":
      return "Tahsilat";

    case "payment":
      return "Ödeme";

    case "order":
      return "Sipariş";

    case "manual":
      return "Manuel";

    default:
      return source ||
        "Manuel";

  }

}


/* =========================================================
   COMPONENT
========================================================= */

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
    editingMovement,
    setEditingMovement,
  ] = useState(
    null
  );


  const [
    selectedMovement,
    setSelectedMovement,
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

    accountId:
      "",

    direction:
      "Giriş",

    amount:
      "",

    description:
      "",

    date:
      new Date()
        .toISOString()
        .slice(
          0,
          10
        ),

    method:
      "Nakit",

  });


  /* =======================================================
     ÖZETLER
  ======================================================= */

  const totalCash =
    useMemo(() => {

      return accounts
        .filter(
          (
            account
          ) =>
            account.type ===
            "Kasa"
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

    }, [
      accounts,
    ]);


  const totalBank =
    useMemo(() => {

      return accounts
        .filter(
          (
            account
          ) =>
            account.type ===
            "Banka"
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

    }, [
      accounts,
    ]);


  const totalPos =
    useMemo(() => {

      return accounts
        .filter(
          (
            account
          ) =>
            account.type ===
            "POS"
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

    }, [
      accounts,
    ]);


  const totalLiquidity =
    totalCash +
    totalBank +
    totalPos;


  /* =======================================================
     HESAP FORM TEMİZLE
  ======================================================= */

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


  /* =======================================================
     HESAP YENİ
  ======================================================= */

  const openNewAccount =
    () => {

      resetAccountForm();

      setShowAccountModal(
        true
      );

    };


  /* =======================================================
     HESAP DÜZENLE
  ======================================================= */

  const openEditAccount =
    (
      account
    ) => {

      setEditingAccount(
        account
      );


      setAccountForm({

        name:
          account.name ||
          "",

        type:
          account.type ||
          "Banka",

        bank:
          account.bank ||
          "",

        iban:
          account.iban ||
          "",

        openingBalance:
          account.balance ??
          "",

      });


      setShowAccountModal(
        true
      );

    };


  /* =======================================================
     HESAP KAYDET
  ======================================================= */

  const handleAccountSubmit =
    (
      event
    ) => {

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

        /*
          Hesap bakiyesini doğrudan
          değiştirebilmemize izin veriyoruz.
          Bu, manuel başlangıç/düzeltme
          bakiyesi içindir.
        */

        const updatedAccounts =
          accounts.map(
            (
              account
            ) => {

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
          updatedAccounts
        );


        setAccounts(
          updatedAccounts
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


        const updatedAccounts = [
          ...accounts,
          newAccount,
        ];


        saveAccounts(
          updatedAccounts
        );


        setAccounts(
          updatedAccounts
        );

      }


      resetAccountForm();


      setShowAccountModal(
        false
      );

    };


  /* =======================================================
     HESAP SİL
  ======================================================= */

  const deleteAccount =
    (
      accountId
    ) => {

      const account =
        accounts.find(
          (
            item
          ) =>
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


      const hasMovement =
        movements.some(
          (
            movement
          ) =>
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
          "Bu hesaba ait hareketler bulunduğu için hesap silinemez. Önce hareketleri silin."
        );

        return;

      }


      const confirmed =
        window.confirm(
          `${account.name} hesabını silmek istediğinize emin misiniz?`
        );


      if (
        !confirmed
      ) {
        return;
      }


      const updatedAccounts =
        accounts.filter(
          (
            item
          ) =>
            String(
              item.id
            ) !==
            String(
              accountId
            )
        );


      saveAccounts(
        updatedAccounts
      );


      setAccounts(
        updatedAccounts
      );

    };


  /* =======================================================
     HAREKET FORM TEMİZLE
  ======================================================= */

  const resetMovementForm =
    () => {

      setMovementForm({

        accountId:
          "",

        direction:
          "Giriş",

        amount:
          "",

        description:
          "",

        date:
          new Date()
            .toISOString()
            .slice(
              0,
              10
            ),

        method:
          "Nakit",

      });


      setEditingMovement(
        null
      );

    };


  /* =======================================================
     YENİ HAREKET
  ======================================================= */

  const openMovement =
    (
      accountId = ""
    ) => {

      setEditingMovement(
        null
      );


      setMovementForm({

        accountId:
          accountId ||
          "",

        direction:
          "Giriş",

        amount:
          "",

        description:
          "",

        date:
          new Date()
            .toISOString()
            .slice(
              0,
              10
            ),

        method:
          "Nakit",

      });


      setShowMovementModal(
        true
      );

    };


  /* =======================================================
     HAREKET DÜZENLE
  ======================================================= */

  const openEditMovement =
    (
      movement
    ) => {

      setSelectedMovement(
        null
      );


      setEditingMovement(
        movement
      );


      setMovementForm({

        accountId:
          movement.accountId ||
          "",

        direction:
          movement.direction ||
          "Giriş",

        amount:
          movement.amount ??
          "",

        description:
          movement.description ||
          "",

        date:
          movement.date ||
          new Date()
            .toISOString()
            .slice(
              0,
              10
            ),

        method:
          movement.method ||
          "Nakit",

      });


      setShowMovementModal(
        true
      );

    };


  /* =======================================================
     HAREKET DETAY
  ======================================================= */

  const openMovementDetail =
    (
      movement
    ) => {

      setSelectedMovement(
        movement
      );

    };


  /* =======================================================
     HAREKET SİL
  ======================================================= */

  const deleteMovement =
    (
      movement
    ) => {

      const account =
        accounts.find(
          (
            item
          ) =>
            String(
              item.id
            ) ===
            String(
              movement.accountId
            )
        );


      const confirmed =
        window.confirm(
          `${movement.description || "Bu finans hareketi"} silinsin mi?\n\n` +
          `Tutar: ${money(
            movement.amount
          )} TL\n` +
          `Hesap: ${
            movement.accountName ||
            account?.name ||
            "—"
          }`
        );


      if (
        !confirmed
      ) {
        return;
      }


      const correction =
        signedAmount(
          movement
        );


      /*
        Mevcut hareketin etkisini
        hesaptan geri alıyoruz.

        Giriş silinirse:
        bakiye - giriş

        Çıkış silinirse:
        bakiye + çıkış
      */

      const updatedAccounts =
        accounts.map(
          (
            item
          ) => {

            if (
              String(
                item.id
              ) !==
              String(
                movement.accountId
              )
            ) {

              return item;

            }


            return {

              ...item,

              balance:
                number(
                  item.balance
                ) -
                correction,

            };

          }
        );


      const updatedMovements =
        movements.filter(
          (
            item
          ) =>
            String(
              item.id
            ) !==
            String(
              movement.id
            )
        );


      saveAccounts(
        updatedAccounts
      );


      saveMovements(
        updatedMovements
      );


      setAccounts(
        updatedAccounts
      );


      setMovements(
        updatedMovements
      );


      setSelectedMovement(
        null
      );

    };


  /* =======================================================
     HAREKET KAYDET / GÜNCELLE
  ======================================================= */

  const handleMovementSubmit =
    (
      event
    ) => {

      event.preventDefault();


      const amount =
        number(
          movementForm.amount
        );


      if (
        amount <=
        0
      ) {

        alert(
          "Geçerli bir tutar giriniz."
        );

        return;

      }


      const account =
        accounts.find(
          (
            item
          ) =>
            String(
              item.id
            ) ===
            String(
              movementForm.accountId
            )
        );


      if (!account) {

        alert(
          "Hesap seçiniz."
        );

        return;

      }


      /* =================================================
         DÜZENLEME
      ================================================= */

      if (
        editingMovement
      ) {

        const oldSigned =
          signedAmount(
            editingMovement
          );


        const newSigned =
          movementForm.direction ===
          "Giriş"
            ? amount
            : -amount;


        let updatedAccounts =
          accounts;


        /*
          Eski hareketin etkisini geri al.
        */

        updatedAccounts =
          updatedAccounts.map(
            (
              item
            ) => {

              if (
                String(
                  item.id
                ) ===
                String(
                  editingMovement.accountId
                )
              ) {

                return {

                  ...item,

                  balance:
                    number(
                      item.balance
                    ) -
                    oldSigned,

                };

              }


              return item;

            }
          );


        /*
          Yeni hareketin etkisini
          yeni hesaba uygula.
        */

        updatedAccounts =
          updatedAccounts.map(
            (
              item
            ) => {

              if (
                String(
                  item.id
                ) ===
                String(
                  account.id
                )
              ) {

                return {

                  ...item,

                  balance:
                    number(
                      item.balance
                    ) +
                    newSigned,

                };

              }


              return item;

            }
          );


        const updatedMovement = {

          ...editingMovement,

          accountId:
            account.id,

          accountName:
            account.name,

          accountType:
            account.type,

          direction:
            movementForm.direction,

          amount,

          description:
            movementForm.description.trim() ||
            "Manuel finans hareketi",

          date:
            movementForm.date,

          method:
            movementForm.method,

          updatedAt:
            new Date()
              .toISOString(),

        };


        const updatedMovements =
          movements.map(
            (
              movement
            ) =>
              String(
                movement.id
              ) ===
              String(
                editingMovement.id
              )
                ? updatedMovement
                : movement
          );


        saveAccounts(
          updatedAccounts
        );


        saveMovements(
          updatedMovements
        );


        setAccounts(
          updatedAccounts
        );


        setMovements(
          updatedMovements
        );


        resetMovementForm();


        setShowMovementModal(
          false
        );


        return;

      }


      /* =================================================
         YENİ HAREKET
      ================================================= */

      const signed =
        movementForm.direction ===
        "Giriş"
          ? amount
          : -amount;


      const updatedAccounts =
        accounts.map(
          (
            item
          ) => {

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
                signed,

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
          account.type,

        direction:
          movementForm.direction,

        amount,

        description:
          movementForm.description.trim() ||
          "Manuel finans hareketi",

        date:
          movementForm.date,

        method:
          movementForm.method,

        source:
          "manual",

        createdAt:
          new Date()
            .toISOString(),

      };


      const updatedMovements = [
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
        updatedAccounts
      );


      setMovements(
        updatedMovements
      );


      resetMovementForm();


      setShowMovementModal(
        false
      );

    };


  /* =======================================================
     HAREKET SIRALAMA
  ======================================================= */

  const sortedMovements =
    useMemo(() => {

      return [
        ...movements,
      ].sort(
        (
          a,
          b
        ) => {

          const dateA =
            String(
              a.date ||
              ""
            );

          const dateB =
            String(
              b.date ||
              ""
            );


          const dateCompare =
            dateB.localeCompare(
              dateA
            );


          if (
            dateCompare !==
            0
          ) {

            return dateCompare;

          }


          return String(
            b.createdAt ||
            ""
          ).localeCompare(
            String(
              a.createdAt ||
              ""
            )
          );

        }
      );

    }, [
      movements,
    ]);


  return (

    <div className="cash-bank-page">

      <div className="cash-bank-container">


        {/* =================================================
            HEADER
        ================================================= */}

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
              type="button"
              className="cash-bank-secondary-button"
              onClick={() => {

                setAccounts(
                  readAccounts()
                );

                setMovements(
                  readMovements()
                );

              }}
            >
              ↻ Yenile
            </button>


            <button
              type="button"
              className="cash-bank-primary-button"
              onClick={
                openNewAccount
              }
            >
              + Yeni Hesap
            </button>

          </div>

        </div>


        {/* =================================================
            SUMMARY
        ================================================= */}

        <div className="cash-bank-summary">

          <div className="cash-bank-summary-card">

            <span>
              TOPLAM KASA
            </span>

            <strong>
              {
                money(
                  totalCash
                )
              } TL
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
              {
                money(
                  totalBank
                )
              } TL
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
              {
                money(
                  totalPos
                )
              } TL
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
              {
                money(
                  totalLiquidity
                )
              } TL
            </strong>

            <small>
              Kasa + banka + POS
            </small>

          </div>

        </div>


        {/* =================================================
            TABS
        ================================================= */}

        <div className="cash-bank-tabs">

          <button
            type="button"
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
            type="button"
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
            Hareketler
          </button>

        </div>


        {/* =================================================
            KASA / BANKA HESAPLARI
        ================================================= */}

        {
          activeTab ===
          "accounts" && (

            <div className="cash-bank-card">

              <div className="cash-bank-card-header">

                <div>

                  <strong>
                    Kasa ve Banka Hesapları
                  </strong>

                  <span>
                    Hesap ekleyin, düzenleyin veya yönetin.
                  </span>

                </div>


                <button
                  type="button"
                  className="cash-bank-small-primary"
                  onClick={
                    openNewAccount
                  }
                >
                  + Yeni Hesap
                </button>

              </div>


              <div className="cash-bank-account-grid">

                {
                  accounts
                    .filter(
                      (
                        account
                      ) =>
                        account.type !==
                        "POS"
                    )
                    .map(
                      (
                        account
                      ) => (

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
                                  account.type
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
                                  account.type
                                }

                                {
                                  account.bank
                                    ? ` • ${account.bank}`
                                    : ""
                                }

                              </span>

                            </div>

                          </div>


                          <div className="cash-bank-account-balance">

                            {
                              money(
                                account.balance
                              )
                            } TL

                          </div>


                          {
                            account.iban && (

                              <div className="cash-bank-iban">
                                {
                                  account.iban
                                }
                              </div>

                            )
                          }


                          <div className="cash-bank-account-footer">

                            <span className="cash-bank-status">
                              ● {
                                account.status ||
                                "Aktif"
                              }
                            </span>


                            <div>

                              <button
                                type="button"
                                onClick={() =>
                                  openMovement(
                                    account.id
                                  )
                                }
                              >
                                Hareket
                              </button>


                              <button
                                type="button"
                                onClick={() =>
                                  openEditAccount(
                                    account
                                  )
                                }
                              >
                                Düzenle
                              </button>


                              <button
                                type="button"
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
                    )
                }

              </div>

            </div>

          )
        }


        {/* =================================================
            POS
        ================================================= */}

        {
          activeTab ===
          "pos" && (

            <div className="cash-bank-card">

              <div className="cash-bank-card-header">

                <div>

                  <strong>
                    POS / Kredi Kartı Hesapları
                  </strong>

                  <span>
                    POS cihazlarınızı ve kartlı tahsilatları yönetin.
                  </span>

                </div>


                <button
                  type="button"
                  className="cash-bank-small-primary"
                  onClick={() => {

                    resetAccountForm();


                    setAccountForm({

                      name:
                        "",

                      type:
                        "POS",

                      bank:
                        "",

                      iban:
                        "",

                      openingBalance:
                        "",

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

                {
                  accounts
                    .filter(
                      (
                        account
                      ) =>
                        account.type ===
                        "POS"
                    )
                    .map(
                      (
                        account
                      ) => (

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

                                {
                                  account.bank
                                    ? ` • ${account.bank}`
                                    : ""
                                }

                              </span>

                            </div>

                          </div>


                          <div className="cash-bank-account-balance">

                            {
                              money(
                                account.balance
                              )
                            } TL

                          </div>


                          <div className="cash-bank-account-footer">

                            <span className="cash-bank-status">

                              ● {
                                account.status ||
                                "Aktif"
                              }

                            </span>


                            <div>

                              <button
                                type="button"
                                onClick={() =>
                                  openMovement(
                                    account.id
                                  )
                                }
                              >
                                Hareket
                              </button>


                              <button
                                type="button"
                                onClick={() =>
                                  openEditAccount(
                                    account
                                  )
                                }
                              >
                                Düzenle
                              </button>


                              <button
                                type="button"
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
                    )
                }

              </div>

            </div>

          )
        }


        {/* =================================================
            HAREKETLER
        ================================================= */}

        {
          activeTab ===
          "movements" && (

            <div className="cash-bank-card">

              <div className="cash-bank-card-header">

                <div>

                  <strong>
                    Finans Hareketleri
                  </strong>

                  <span>
                    Kasa, banka ve POS hareketleri
                  </span>

                </div>


                <button
                  type="button"
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

                      <th>
                        İŞLEMLER
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {
                      sortedMovements.length ===
                      0 ? (

                        <tr>

                          <td
                            colSpan="8"
                            style={{
                              textAlign:
                                "center",
                              padding:
                                "40px",
                              color:
                                "#9299a2",
                            }}
                          >

                            Henüz finans hareketi bulunmuyor.

                          </td>

                        </tr>

                      ) : (

                        sortedMovements.map(
                          (
                            movement
                          ) => (

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


                              <td>

                                <strong>
                                  {
                                    movement.accountName ||
                                    "—"
                                  }
                                </strong>

                              </td>


                              <td>

                                {
                                  movement.description ||
                                  "—"
                                }

                              </td>


                              <td>

                                {
                                  movement.method ||
                                  "—"
                                }

                              </td>


                              <td>

                                <span
                                  style={{
                                    fontSize:
                                      "10px",
                                    color:
                                      "#7d8690",
                                  }}
                                >

                                  {
                                    sourceLabel(
                                      movement.source
                                    )
                                  }

                                </span>

                              </td>


                              <td>

                                <span
                                  style={{
                                    color:
                                      movement.direction ===
                                      "Giriş"
                                        ? "#388a62"
                                        : "#c54c48",
                                    fontWeight:
                                      700,
                                  }}
                                >

                                  {
                                    movement.direction
                                  }

                                </span>

                              </td>


                              <td>

                                <strong
                                  style={{
                                    color:
                                      movement.direction ===
                                      "Giriş"
                                        ? "#388a62"
                                        : "#c54c48",
                                  }}
                                >

                                  {
                                    movement.direction ===
                                    "Giriş"
                                      ? "+"
                                      : "-"
                                  }

                                  {
                                    money(
                                      movement.amount
                                    )
                                  } TL

                                </strong>

                              </td>


                              <td>

                                <div
                                  style={{
                                    display:
                                      "flex",
                                    gap:
                                      "5px",
                                    flexWrap:
                                      "wrap",
                                  }}
                                >

                                  <button
                                    type="button"
                                    onClick={() =>
                                      openMovementDetail(
                                        movement
                                      )
                                    }
                                    style={{
                                      border:
                                        "1px solid #dfe3e7",
                                      background:
                                        "#fff",
                                      borderRadius:
                                        "4px",
                                      padding:
                                        "5px 7px",
                                      cursor:
                                        "pointer",
                                      fontSize:
                                        "10px",
                                      color:
                                        "#606a74",
                                    }}
                                  >
                                    Detay
                                  </button>


                                  <button
                                    type="button"
                                    onClick={() =>
                                      openEditMovement(
                                        movement
                                      )
                                    }
                                    style={{
                                      border:
                                        "1px solid #dfe3e7",
                                      background:
                                        "#fff",
                                      borderRadius:
                                        "4px",
                                      padding:
                                        "5px 7px",
                                      cursor:
                                        "pointer",
                                      fontSize:
                                        "10px",
                                      color:
                                        "#606a74",
                                    }}
                                  >
                                    Düzenle
                                  </button>


                                  <button
                                    type="button"
                                    onClick={() =>
                                      deleteMovement(
                                        movement
                                      )
                                    }
                                    style={{
                                      border:
                                        "1px solid #f0cdcd",
                                      background:
                                        "#fff",
                                      borderRadius:
                                        "4px",
                                      padding:
                                        "5px 7px",
                                      cursor:
                                        "pointer",
                                      fontSize:
                                        "10px",
                                      color:
                                        "#c54c48",
                                    }}
                                  >
                                    Sil
                                  </button>

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

            </div>

          )
        }


        {/* =================================================
            HESAP MODALI
        ================================================= */}

        {
          showAccountModal && (

            <div
              className="cash-bank-modal-overlay"
              onMouseDown={(
                event
              ) => {

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
                      {
                        editingAccount
                          ? "Hesabı Düzenle"
                          : "Yeni Hesap"
                      }
                    </strong>

                    <span>
                      Kasa, banka veya POS hesabı
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
                      onChange={(
                        event
                      ) =>
                        setAccountForm(
                          (
                            current
                          ) => ({
                            ...current,

                            name:
                              event.target.value,
                          })
                        )
                      }
                      placeholder="Örn. Garanti Bankası"
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
                      onChange={(
                        event
                      ) =>
                        setAccountForm(
                          (
                            current
                          ) => ({
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
                        POS
                      </option>

                    </select>

                  </div>


                  {
                    accountForm.type !==
                    "Kasa" && (

                      <>
                        <div className="cash-bank-form-group">

                          <label>
                            Banka
                          </label>

                          <input
                            type="text"
                            value={
                              accountForm.bank
                            }
                            onChange={(
                              event
                            ) =>
                              setAccountForm(
                                (
                                  current
                                ) => ({
                                  ...current,

                                  bank:
                                    event.target.value,
                                })
                              )
                            }
                            placeholder="Örn. Ziraat Bankası"
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
                            onChange={(
                              event
                            ) =>
                              setAccountForm(
                                (
                                  current
                                ) => ({
                                  ...current,

                                  iban:
                                    event.target.value,
                                })
                              )
                            }
                            placeholder="TR00 0000..."
                          />

                        </div>
                      </>

                    )
                  }


                  <div className="cash-bank-form-group">

                    <label>
                      Bakiye
                    </label>

                    <input
                      type="text"
                      inputMode="decimal"
                      value={
                        accountForm.openingBalance
                      }
                      onChange={(
                        event
                      ) =>
                        setAccountForm(
                          (
                            current
                          ) => ({
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
                      {
                        editingAccount
                          ? "Değişiklikleri Kaydet"
                          : "Hesabı Oluştur"
                      }
                    </button>

                  </div>

                </form>

              </div>

            </div>

          )
        }


        {/* =================================================
            HAREKET MODALI
        ================================================= */}

        {
          showMovementModal && (

            <div
              className="cash-bank-modal-overlay"
              onMouseDown={(
                event
              ) => {

                if (
                  event.target ===
                  event.currentTarget
                ) {

                  setShowMovementModal(
                    false
                  );

                  resetMovementForm();

                }

              }}
            >

              <div className="cash-bank-modal">

                <div className="cash-bank-modal-header">

                  <div>

                    <strong>
                      {
                        editingMovement
                          ? "Finans Hareketini Düzenle"
                          : "Para Girişi / Çıkışı"
                      }
                    </strong>

                    <span>
                      {
                        editingMovement
                          ? "Mevcut hareketi düzeltin."
                          : "Finans hareketi ekle"
                      }
                    </span>

                  </div>


                  <button
                    type="button"
                    onClick={() => {

                      setShowMovementModal(
                        false
                      );

                      resetMovementForm();

                    }}
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
                      onChange={(
                        event
                      ) =>
                        setMovementForm(
                          (
                            current
                          ) => ({
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


                      {
                        accounts.map(
                          (
                            account
                          ) => (

                            <option
                              key={
                                account.id
                              }
                              value={
                                account.id
                              }
                            >

                              {
                                account.name
                              }

                              {" — "}

                              {
                                account.type
                              }

                            </option>

                          )
                        )
                      }

                    </select>

                  </div>


                  <div className="cash-bank-form-group">

                    <label>
                      Yön
                    </label>


                    <select
                      value={
                        movementForm.direction
                      }
                      onChange={(
                        event
                      ) =>
                        setMovementForm(
                          (
                            current
                          ) => ({
                            ...current,

                            direction:
                              event.target.value,
                          })
                        )
                      }
                    >

                      <option value="Giriş">
                        Giriş
                      </option>

                      <option value="Çıkış">
                        Çıkış
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
                      onChange={(
                        event
                      ) =>
                        setMovementForm(
                          (
                            current
                          ) => ({
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


                  <div className="cash-bank-form-group">

                    <label>
                      Tarih
                    </label>

                    <input
                      type="date"
                      value={
                        movementForm.date
                      }
                      onChange={(
                        event
                      ) =>
                        setMovementForm(
                          (
                            current
                          ) => ({
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
                      Yöntem
                    </label>


                    <select
                      value={
                        movementForm.method
                      }
                      onChange={(
                        event
                      ) =>
                        setMovementForm(
                          (
                            current
                          ) => ({
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
                        Havale / EFT
                      </option>

                      <option>
                        Kredi Kartı
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


                  <div className="cash-bank-form-group">

                    <label>
                      Açıklama
                    </label>

                    <textarea
                      value={
                        movementForm.description
                      }
                      onChange={(
                        event
                      ) =>
                        setMovementForm(
                          (
                            current
                          ) => ({
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
                      onClick={() => {

                        setShowMovementModal(
                          false
                        );

                        resetMovementForm();

                      }}
                    >
                      Vazgeç
                    </button>


                    <button
                      type="submit"
                      className="cash-bank-modal-submit"
                    >
                      {
                        editingMovement
                          ? "Değişiklikleri Kaydet"
                          : "Hareketi Kaydet"
                      }
                    </button>

                  </div>

                </form>

              </div>

            </div>

          )
        }


        {/* =================================================
            HAREKET DETAY MODALI
        ================================================= */}

        {
          selectedMovement && (

            <div
              className="cash-bank-modal-overlay"
              onMouseDown={(
                event
              ) => {

                if (
                  event.target ===
                  event.currentTarget
                ) {

                  setSelectedMovement(
                    null
                  );

                }

              }}
            >

              <div className="cash-bank-modal">

                <div className="cash-bank-modal-header">

                  <div>

                    <strong>
                      Finans Hareketi
                    </strong>

                    <span>
                      İşlem detayları
                    </span>

                  </div>


                  <button
                    type="button"
                    onClick={() =>
                      setSelectedMovement(
                        null
                      )
                    }
                  >
                    ×
                  </button>

                </div>


                <div
                  style={{
                    padding:
                      "20px",
                  }}
                >

                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "1fr 1fr",
                      gap:
                        "12px",
                    }}
                  >

                    <div>

                      <span
                        style={{
                          display:
                            "block",
                          color:
                            "#9aa1a9",
                          fontSize:
                            "9px",
                          fontWeight:
                            700,
                          marginBottom:
                            "5px",
                        }}
                      >
                        TARİH
                      </span>

                      <strong>
                        {
                          formatDate(
                            selectedMovement.date
                          )
                        }
                      </strong>

                    </div>


                    <div>

                      <span
                        style={{
                          display:
                            "block",
                          color:
                            "#9aa1a9",
                          fontSize:
                            "9px",
                          fontWeight:
                            700,
                          marginBottom:
                            "5px",
                        }}
                      >
                        HESAP
                      </span>

                      <strong>
                        {
                          selectedMovement.accountName ||
                          "—"
                        }
                      </strong>

                    </div>


                    <div>

                      <span
                        style={{
                          display:
                            "block",
                          color:
                            "#9aa1a9",
                          fontSize:
                            "9px",
                          fontWeight:
                            700,
                          marginBottom:
                            "5px",
                        }}
                      >
                        YÖN
                      </span>

                      <strong
                        style={{
                          color:
                            selectedMovement.direction ===
                            "Giriş"
                              ? "#398962"
                              : "#c64d49",
                        }}
                      >
                        {
                          selectedMovement.direction
                        }
                      </strong>

                    </div>


                    <div>

                      <span
                        style={{
                          display:
                            "block",
                          color:
                            "#9aa1a9",
                          fontSize:
                            "9px",
                          fontWeight:
                            700,
                          marginBottom:
                            "5px",
                        }}
                      >
                        TUTAR
                      </span>

                      <strong
                        style={{
                          fontSize:
                            "18px",
                        }}
                      >
                        {
                          money(
                            selectedMovement.amount
                          )
                        } TL
                      </strong>

                    </div>


                    <div>

                      <span
                        style={{
                          display:
                            "block",
                          color:
                            "#9aa1a9",
                          fontSize:
                            "9px",
                          fontWeight:
                            700,
                          marginBottom:
                            "5px",
                        }}
                      >
                        YÖNTEM
                      </span>

                      <strong>
                        {
                          selectedMovement.method ||
                          "—"
                        }
                      </strong>

                    </div>


                    <div>

                      <span
                        style={{
                          display:
                            "block",
                          color:
                            "#9aa1a9",
                          fontSize:
                            "9px",
                          fontWeight:
                            700,
                          marginBottom:
                            "5px",
                        }}
                      >
                        KAYNAK
                      </span>

                      <strong>
                        {
                          sourceLabel(
                            selectedMovement.source
                          )
                        }
                      </strong>

                    </div>


                    <div
                      style={{
                        gridColumn:
                          "1 / -1",
                      }}
                    >

                      <span
                        style={{
                          display:
                            "block",
                          color:
                            "#9aa1a9",
                          fontSize:
                            "9px",
                          fontWeight:
                            700,
                          marginBottom:
                            "5px",
                        }}
                      >
                        AÇIKLAMA
                      </span>

                      <strong>
                        {
                          selectedMovement.description ||
                          "—"
                        }
                      </strong>

                    </div>

                  </div>


                  <div
                    className="cash-bank-modal-footer"
                    style={{
                      marginTop:
                        "18px",
                      padding:
                        0,
                      borderTop:
                        "1px solid #eee",
                    }}
                  >

                    <button
                      type="button"
                      className="cash-bank-modal-cancel"
                      onClick={() =>
                        setSelectedMovement(
                          null
                        )
                      }
                    >
                      Kapat
                    </button>


                    <button
                      type="button"
                      className="cash-bank-modal-submit"
                      onClick={() => {

                        const movement =
                          selectedMovement;

                        setSelectedMovement(
                          null
                        );

                        openEditMovement(
                          movement
                        );

                      }}
                    >
                      Düzenle
                    </button>


                    <button
                      type="button"
                      className="cash-bank-modal-submit"
                      style={{
                        background:
                          "#c54c48",
                      }}
                      onClick={() =>
                        deleteMovement(
                          selectedMovement
                        )
                      }
                    >
                      Sil
                    </button>

                  </div>

                </div>

              </div>

            </div>

          )
        }

      </div>

    </div>

  );
}