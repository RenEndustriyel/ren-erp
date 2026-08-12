import { formatMoney } from "../../utils/format";
import "./ProductTable.css";

function ProductTable({
  products,
  onEdit,
  onDelete
}) {
  return (
    <div className="table-box">

      <table>

        <thead>

          <tr>
            <th>Barkod</th>
            <th>Ürün</th>
            <th>Kategori</th>
            <th>Marka</th>
            <th>Raf</th>
            <th>Alış</th>
            <th>Satış</th>
            <th>Kâr</th>
            <th>%</th>
            <th>Stok</th>
            <th>İşlem</th>
          </tr>

        </thead>

        <tbody>

          {products.length === 0 && (

            <tr>

              <td
                colSpan="11"
                className="empty-row"
              >
                Kayıtlı ürün bulunamadı.

              </td>

            </tr>

          )}

          {products.map((item) => {

            const purchase =
              Number(item.purchasePrice || 0);

            const sale =
              Number(item.salePrice || 0);

            const profit =
              sale - purchase;

            const rate =
              purchase > 0
                ? (profit / purchase) * 100
                : 0;

            const stock =
              Number(item.stock || 0);

            const min =
              Number(item.minStock || 0);

            return (

              <tr key={item.id}>

                <td>{item.barcode}</td>

                <td>

                  <div className="product-name">

                    <strong>
                      {item.name}
                    </strong>

                  </div>

                </td>

                <td>{item.category}</td>

                <td>{item.brand}</td>

                <td>{item.shelf}</td>

                <td>

                  {formatMoney(
                    purchase
                  )}

                </td>

                <td>

                  {formatMoney(
                    sale
                  )}

                </td>

                <td className="profit">

                  {formatMoney(
                    profit
                  )}

                </td>

                <td>

                  % {rate.toFixed(1)}

                </td>

                <td>

                  {stock <= 0 ? (

                    <span className="badge danger">
                      Stok Yok
                    </span>

                  ) : stock <= min ? (

                    <span className="badge warning">
                      Kritik
                    </span>

                  ) : (

                    <span className="badge success">
                      {stock}
                    </span>

                  )}

                </td>

                <td>

                  <div className="actions">

                    <button
                      className="edit-btn"
                      onClick={() =>
                        onEdit(item)
                      }
                    >
                      Düzenle
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() =>
                        onDelete(item.id)
                      }
                    >
                      Sil
                    </button>

                  </div>

                </td>

              </tr>

            );

          })}

        </tbody>

      </table>

    </div>
  );
}

export default ProductTable;