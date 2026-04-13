import React, { useEffect, useMemo, useState } from "react";
import { useSnackbar } from "notistack";
import {
  subscribeToIngredients,
  subscribeToAllProductIngredients,
} from "../services/ingredientService";
import { subscribeToProducts } from "../services/productService";
import { kioskCheckoutTransaction } from "../services/transactionService";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

const isProductAvailable = (product, productIngredientsMap, ingredients) => {
  const reqs = productIngredientsMap[product.id] ?? [];
  if (reqs.length === 0) return true;
  return reqs.every((req) => {
    const ing = ingredients.find((i) => i.id === req.ingredientId);
    return ing && ing.quantity >= req.requiredQuantity;
  });
};

const KIOSK_STEPS = { MENU: "menu", CART: "cart", CONFIRM: "confirm", SUCCESS: "success" };

const Kiosk = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [step, setStep] = useState(KIOSK_STEPS.MENU);
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [productIngredientsMap, setProductIngredientsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [queueNumber, setQueueNumber] = useState(null);

  useEffect(() => {
    let loadedCount = 0;
    const tryDone = () => { loadedCount++; if (loadedCount >= 2) setLoading(false); };

    const unsubProducts = subscribeToProducts((next) => { setProducts(next); tryDone(); },
      (err) => { tryDone(); enqueueSnackbar(err.message || "Unable to load menu.", { variant: "error" }); });
    const unsubIngredients = subscribeToIngredients((next) => setIngredients(next),
      (err) => enqueueSnackbar(err.message || "Unable to load ingredients.", { variant: "error" }));
    const unsubLinks = subscribeToAllProductIngredients((map) => setProductIngredientsMap(map),
      (err) => enqueueSnackbar(err.message || "Unable to load availability.", { variant: "error" }));

    return () => { unsubProducts(); unsubIngredients(); unsubLinks(); };
  }, []);

  const categories = useMemo(
    () => ["All", ...new Set(products.map((p) => p.category).filter(Boolean))],
    [products],
  );

  const visibleProducts = useMemo(() => {
    const list = selectedCategory === "All" ? products : products.filter((p) => p.category === selectedCategory);
    return list.map((p) => ({
      ...p,
      available: isProductAvailable(p, productIngredientsMap, ingredients),
    }));
  }, [products, selectedCategory, productIngredientsMap, ingredients]);

  const addToCart = (product) => {
    if (!product.available) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) return prev.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQty = (productId, delta) => {
    setCart((prev) =>
      prev.map((i) => i.id === productId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i)
          .filter((i) => i.quantity > 0),
    );
  };

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) { enqueueSnackbar("Your cart is empty.", { variant: "warning" }); return; }
    setCheckoutLoading(true);
    try {
      const result = await kioskCheckoutTransaction({
        cartItems: cart,
        subtotal,
        totalAmount: subtotal,
        productIngredientsMap,
      });
      setQueueNumber(result.queueNumber);
      setCart([]);
      setStep(KIOSK_STEPS.SUCCESS);
    } catch (err) {
      enqueueSnackbar(err.message || "Order failed. Please try again.", { variant: "error" });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const resetKiosk = () => {
    setCart([]);
    setStep(KIOSK_STEPS.MENU);
    setQueueNumber(null);
    setSelectedCategory("All");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1f1f1f] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-[#FFD23F] border-t-transparent" />
          <p className="text-white text-xl font-semibold">Loading Menu...</p>
        </div>
      </div>
    );
  }

  if (step === KIOSK_STEPS.SUCCESS) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E53935] via-[#FF8C42] to-[#FFD23F] flex items-center justify-center p-8">
        <div className="max-w-md w-full rounded-3xl bg-white p-10 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <span className="text-4xl">✓</span>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-[#333333]">Order Placed!</h1>
          <p className="mb-6 text-gray-500">Your order is being prepared.</p>
          <div className="mb-6 rounded-2xl bg-[#FFD23F] p-6">
            <p className="text-sm font-semibold text-[#333333] uppercase tracking-widest">Queue Number</p>
            <p className="mt-1 text-6xl font-bold text-[#333333]">{String(queueNumber).padStart(3, "0")}</p>
          </div>
          <p className="mb-8 text-sm text-gray-400">Please wait for your number to be called.</p>
          <button onClick={resetKiosk} className="w-full rounded-2xl bg-[#E53935] py-4 text-lg font-bold text-white hover:bg-[#c62828] active:scale-95 transition-transform">
            Place Another Order
          </button>
        </div>
      </div>
    );
  }

  if (step === KIOSK_STEPS.CART || step === KIOSK_STEPS.CONFIRM) {
    return (
      <div className="min-h-screen bg-[#F7F7F7]">
        <header className="bg-gradient-to-r from-[#E53935] to-[#FF8C42] px-6 py-4 flex items-center gap-4">
          <button onClick={() => setStep(KIOSK_STEPS.MENU)} className="text-white text-2xl font-bold">←</button>
          <h1 className="text-2xl font-bold text-white flex-1">Your Order</h1>
        </header>
        <div className="max-w-2xl mx-auto p-6">
          {cart.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-6xl mb-4">🛒</p>
              <p className="text-xl text-gray-500">Your cart is empty</p>
              <button onClick={() => setStep(KIOSK_STEPS.MENU)} className="mt-6 rounded-2xl bg-[#FFD23F] px-8 py-4 text-lg font-bold text-[#333333]">Browse Menu</button>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-white p-4 shadow flex items-center gap-4">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-16 w-16 rounded-xl object-cover" />
                    ) : (
                      <div className="h-16 w-16 rounded-xl bg-[#FFD23F] flex items-center justify-center text-2xl">🍽️</div>
                    )}
                    <div className="flex-1">
                      <p className="font-bold text-lg">{item.name}</p>
                      <p className="text-[#FF8C42] font-semibold">{currencyFormatter.format(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => updateQty(item.id, -1)} className="h-10 w-10 rounded-full bg-gray-100 text-xl font-bold hover:bg-gray-200 flex items-center justify-center">−</button>
                      <span className="text-xl font-bold w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="h-10 w-10 rounded-full bg-[#FFD23F] text-xl font-bold hover:bg-[#f0c930] flex items-center justify-center">+</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl bg-white p-5 shadow mb-6">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-[#E53935]">{currencyFormatter.format(subtotal)}</span>
                </div>
              </div>
              <button
                onClick={handlePlaceOrder}
                disabled={checkoutLoading}
                className="w-full rounded-2xl bg-[#E53935] py-5 text-xl font-bold text-white hover:bg-[#c62828] disabled:opacity-60 active:scale-95 transition-transform"
              >
                {checkoutLoading ? "Placing Order..." : "Confirm Order"}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1f1f1f]">
      <header className="bg-gradient-to-r from-[#E53935] via-[#FF8C42] to-[#FFD23F] px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Self-Service Kiosk</h1>
            <p className="text-white/80 text-sm">Tap an item to add it to your order</p>
          </div>
          <button
            onClick={() => setStep(KIOSK_STEPS.CART)}
            className="relative rounded-2xl bg-white px-6 py-3 font-bold text-[#E53935] shadow-lg hover:bg-gray-50 active:scale-95 transition-transform"
          >
            🛒 View Order
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-[#E53935] text-white text-xs font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="px-6 py-4 flex gap-3 overflow-x-auto scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`shrink-0 rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
              selectedCategory === cat
                ? "bg-[#FFD23F] text-[#333333]"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="px-6 pb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {visibleProducts.map((product) => {
          const inCart = cart.find((i) => i.id === product.id);
          return (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              disabled={!product.available}
              className={`relative rounded-3xl text-left overflow-hidden shadow-lg transition-all active:scale-95 ${
                product.available
                  ? "bg-white hover:shadow-xl"
                  : "bg-white/30 opacity-60 cursor-not-allowed"
              }`}
            >
              <div className="h-36 w-full bg-[#2a2a2a] flex items-center justify-center overflow-hidden">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-5xl">🍽️</span>
                )}
              </div>
              {!product.available && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <span className="rounded-full bg-red-600 px-3 py-1 text-sm font-bold text-white">Out of Stock</span>
                </div>
              )}
              {inCart && product.available && (
                <div className="absolute top-2 right-2 h-7 w-7 rounded-full bg-[#FFD23F] text-[#333333] text-sm font-bold flex items-center justify-center shadow">
                  {inCart.quantity}
                </div>
              )}
              <div className="p-3">
                <p className="font-bold text-[#333333] text-sm leading-tight">{product.name}</p>
                <p className="mt-1 text-[#E53935] font-semibold text-sm">{currencyFormatter.format(product.price)}</p>
              </div>
            </button>
          );
        })}
      </div>

      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#1f1f1f]">
          <button
            onClick={() => setStep(KIOSK_STEPS.CART)}
            className="w-full rounded-2xl bg-gradient-to-r from-[#E53935] to-[#FF8C42] py-5 text-lg font-bold text-white shadow-2xl hover:opacity-90 active:scale-95 transition-transform"
          >
            View Order — {cartCount} item{cartCount !== 1 ? "s" : ""} · {currencyFormatter.format(subtotal)}
          </button>
        </div>
      )}
    </div>
  );
};

export default Kiosk;
