import { supabase } from "../lib/supabase";

function mapProduct(product) {
  return {
    id: product.id,

    barcode: product.barcode || "",

    name: product.name || "",

    category:
      product.categories?.name || "Diğer",

    categoryId:
      product.category_id || null,

    brand: product.brand || "",

    unit: product.unit || "Adet",

    buy: Number(
      product.purchase_price || 0
    ),

    purchasePrice: Number(
      product.purchase_price || 0
    ),

    purchasePriceType:
      product.purchase_price_type ||
      "exclusive",

    sale: Number(
      product.sale_price || 0
    ),

    salePrice: Number(
      product.sale_price || 0
    ),

    salePriceType:
      product.sale_price_type ||
      "exclusive",

    vatRate: Number(
      product.vat_rate || 0
    ),

    stock: Number(
      product.stock_quantity || 0
    ),

    criticalStock: Number(
      product.critical_stock || 0
    ),

    minSalePrice: Number(
      product.min_sale_price || 0
    ),

    description:
      product.description || "",

    isActive:
      product.is_active !== false,

    createdAt:
      product.created_at,

    updatedAt:
      product.updated_at,
  };
}

const productService = {
  async getAll() {
    const { data, error } =
      await supabase
        .from("products")
        .select(`
          *,
          categories (
            id,
            name
          )
        `)
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      console.error(
        "Ürünler alınamadı:",
        error
      );

      throw error;
    }

    return (data || []).map(mapProduct);
  },

  async getByBarcode(barcode) {
    if (!barcode) return null;

    const { data, error } =
      await supabase
        .from("products")
        .select(`
          *,
          categories (
            id,
            name
          )
        `)
        .eq("barcode", barcode)
        .maybeSingle();

    if (error) {
      console.error(
        "Barkod ile ürün alınamadı:",
        error
      );

      throw error;
    }

    return data ? mapProduct(data) : null;
  },

  async getById(id) {
    if (!id) return null;

    const { data, error } =
      await supabase
        .from("products")
        .select(`
          *,
          categories (
            id,
            name
          )
        `)
        .eq("id", id)
        .maybeSingle();

    if (error) {
      console.error(
        "Ürün alınamadı:",
        error
      );

      throw error;
    }

    return data ? mapProduct(data) : null;
  },

  async create(product) {
    const payload = {
      name: product.name,

      barcode:
        product.barcode || null,

      category_id:
        product.categoryId || null,

      brand:
        product.brand || null,

      unit:
        product.unit || "Adet",

      purchase_price:
        Number(product.purchasePrice || 0),

      purchase_price_type:
        product.purchasePriceType ||
        "exclusive",

      sale_price:
        Number(product.salePrice || 0),

      sale_price_type:
        product.salePriceType ||
        "exclusive",

      vat_rate:
        Number(product.vatRate || 0),

      stock_quantity:
        Number(product.stockQuantity || 0),

      critical_stock:
        Number(product.criticalStock || 0),

      min_sale_price:
        Number(product.minSalePrice || 0),

      description:
        product.description || null,

      is_active: true,
    };

    const { data, error } =
      await supabase
        .from("products")
        .insert(payload)
        .select()
        .single();

    if (error) {
      console.error(
        "Ürün oluşturulamadı:",
        error
      );

      throw error;
    }

    return data;
  },

  async update(id, product) {
    const payload = {
      name: product.name,

      barcode:
        product.barcode || null,

      category_id:
        product.categoryId || null,

      brand:
        product.brand || null,

      unit:
        product.unit || "Adet",

      purchase_price:
        Number(product.purchasePrice || 0),

      purchase_price_type:
        product.purchasePriceType ||
        "exclusive",

      sale_price:
        Number(product.salePrice || 0),

      sale_price_type:
        product.salePriceType ||
        "exclusive",

      vat_rate:
        Number(product.vatRate || 0),

      stock_quantity:
        Number(product.stockQuantity || 0),

      critical_stock:
        Number(product.criticalStock || 0),

      min_sale_price:
        Number(product.minSalePrice || 0),

      description:
        product.description || null,

      updated_at:
        new Date().toISOString(),
    };

    const { data, error } =
      await supabase
        .from("products")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

    if (error) {
      console.error(
        "Ürün güncellenemedi:",
        error
      );

      throw error;
    }

    return data;
  },

  async delete(id) {
    const { error } =
      await supabase
        .from("products")
        .delete()
        .eq("id", id);

    if (error) {
      console.error(
        "Ürün silinemedi:",
        error
      );

      throw error;
    }
  },

  async updateStock(id, quantity) {
    const product =
      await this.getById(id);

    if (!product) {
      throw new Error(
        "Stok güncellenecek ürün bulunamadı."
      );
    }

    const oldStock =
      Number(product.stock || 0);

    const change =
      Number(quantity || 0);

    const newStock =
      oldStock - change;

    const { error } =
      await supabase
        .from("products")
        .update({
          stock_quantity:
            newStock,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", id);

    if (error) {
      console.error(
        "Stok güncellenemedi:",
        error
      );

      throw error;
    }

    await supabase
      .from("stock_movements")
      .insert({
        product_id: id,
        movement_type: "sale",
        quantity: change,
        unit_cost:
          Number(product.buy || 0),
        note:
          "Satış kaynaklı stok düşümü",
      });

    return newStock;
  },
};

export default productService;