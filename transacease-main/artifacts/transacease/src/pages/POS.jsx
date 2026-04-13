import React, { useEffect, useMemo, useState } from "react";
import { useSnackbar } from "notistack";
import ProductCard from "../components/ProductCard";
import { useAuth } from "../context/AuthContext";
import { subscribeToProducts } from "../services/productService";
import { checkoutTransaction } from "../services/transactionService";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

const POS = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(null);
  const [promoValue, setPromoValue] = useState(0);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToProducts(
      (nextProducts) => {
        setProducts(nextProducts);
        setLoadingProducts(false);
      },
      (error) => {
        setLoadingProducts(false);
        enqueueSnackbar(error.message || "Unable to load products.", { variant: "error" });
      },
    );

    return unsubscribe;
  }, []);

  const categories = useMemo(() => ["All", ...new Set(products.map((item) => item.category).filter(Boolean))], [products]);

  const visibleProducts = useMemo(() => {
    if (selectedCategory === "All") return products;
    return products.filter((item) => item.category === selectedCategory);
  }, [products, selectedCategory]);

  const addToCart = (product) => {
    if (product.stock <= 0) {
      enqueueSnackbar(`${product.name} is out of stock.`, { variant: "warning" });
      return;
    }

    setCart((previous) => {
      const existing = previous.find((item) => item.id === product.id);

      if (existing) {
        if (existing.quantity >= product.stock) {
          enqueueSnackbar(`Only ${product.stock} in stock for ${product.name}.`, { variant: "warning" });
          return previous;
        }

        return previous.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      }

      return [...previous, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart((previous) =>
      previous
        .map((item) => {
          if (item.id !== productId) return item;

          const product = products.find((entry) => entry.id === productId);
          const nextQuantity = item.quantity + delta;

          if (nextQuantity <= 0) return null;

          if (product && nextQuantity > product.stock) {
            enqueueSnackbar(`Only ${product.stock} in stock for ${item.name}.`, { variant: "warning" });
            return item;
          }

          return { ...item, quantity: nextQuantity };
        })
        .filter(Boolean),
    );
  };

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const discountAmount = useMemo(() => {
    if (discount === "senior" || discount === "pwd") return subtotal * 0.2;
    if (discount === "promo") return subtotal * (Math.max(promoValue, 0) / 100);
    return 0;
  }, [discount, promoValue, subtotal]);
  const total = useMemo(() => Math.max(subtotal - discountAmount, 0), [subtotal, discountAmount]);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      enqueueSnackbar("Cart is empty.", { variant: "warning" });
      return;
    }

    setCheckoutLoading(true);

    try {
      await checkoutTransaction({
        cartItems: cart,
        cashier: user,
        subtotal,
        discountAmount,
        totalAmount: total,
        discountType: discount ?? "none",
        promoValue,
      });

      setCart([]);
      setDiscount(null);
      setPromoValue(0);
      enqueueSnackbar("Checkout completed.", { variant: "success" });
    } catch (error) {
      enqueueSnackbar(error.message || "Checkout failed.", { variant: "error" });
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7] p-4 md:p-6 lg:p-8">
      <header className="mb-4 flex items-center justify-between rounded-xl bg-gradient-to-r from-[#E53935] via-[#FF8C42] to-[#FFD23F] p-4 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 font-bold">W</div>
          <span className="text-2xl font-bold font-poppins">TransactEase POS</span>
        </div>
        <div className="rounded-lg bg-white/20 px-3 py-1 text-sm font-semibold">Cart {cart.length}</div>
      </header>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex-1">
          <div className="mb-4 flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  selectedCategory === category ? "bg-[#FFD23F] text-[#333333]" : "border border-gray-300 bg-white text-[#333333]"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {loadingProducts ? (
            <div className="rounded-xl bg-white p-8 text-center text-gray-500 shadow-sm">Loading products...</div>
          ) : visibleProducts.length === 0 ? (
            <div className="rounded-xl bg-white p-8 text-center text-gray-500 shadow-sm">No products available in this category.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} onAdd={addToCart} />
              ))}
            </div>
          )}
        </div>

        <div className="w-full lg:w-96">
          <div className="rounded-xl bg-white p-4 shadow-lg">
            <h3 className="text-xl font-bold text-[#333333]">Cart</h3>
            <div className="mt-3 space-y-3">
              {cart.length === 0 ? (
                <p className="text-sm text-gray-500">No items added yet.</p>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border p-2">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        {currencyFormatter.format(item.price)} x {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQuantity(item.id, -1)} className="rounded bg-gray-100 px-2">
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="rounded bg-gray-100 px-2">
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 space-y-2 rounded-lg border bg-[#FFF8E1] p-3">
              <p className="text-sm text-[#333333]">Subtotal: {currencyFormatter.format(subtotal)}</p>
              <p className="text-sm text-[#333333]">Discount: {currencyFormatter.format(discountAmount)}</p>
              <p className="text-lg font-bold">Total: {currencyFormatter.format(total)}</p>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <button onClick={() => setDiscount("senior")} className={`rounded-lg px-2 py-2 text-xs font-semibold ${discount === "senior" ? "bg-[#FF8C42] text-white" : "bg-[#FFD23F] text-[#333333]"}`}>
                Senior
              </button>
              <button onClick={() => setDiscount("pwd")} className={`rounded-lg px-2 py-2 text-xs font-semibold ${discount === "pwd" ? "bg-[#FF8C42] text-white" : "bg-[#FFD23F] text-[#333333]"}`}>
                PWD
              </button>
              <button onClick={() => setDiscount("promo")} className={`rounded-lg px-2 py-2 text-xs font-semibold ${discount === "promo" ? "bg-[#FF8C42] text-white" : "bg-[#FFD23F] text-[#333333]"}`}>
                Promo
              </button>
            </div>

            {discount === "promo" && (
              <input
                type="number"
                min="0"
                max="100"
                value={promoValue}
                onChange={(event) => setPromoValue(Number(event.target.value))}
                placeholder="Promo %"
                className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            )}

            <button
              onClick={handleCheckout}
              disabled={checkoutLoading || cart.length === 0}
              className="mt-4 w-full rounded-xl bg-[#FF8C42] py-3 font-bold text-white hover:bg-[#E53935] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {checkoutLoading ? "Processing..." : "Checkout"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POS;
