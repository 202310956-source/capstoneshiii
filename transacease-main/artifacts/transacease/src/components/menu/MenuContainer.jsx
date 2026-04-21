import React, { useEffect, useState, useMemo } from "react";
import { GrRadialSelected } from "react-icons/gr";
import { FaShoppingCart } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { addItems } from "../../redux/slices/cartSlice";
import { subscribeToProducts } from "../../services/productService";

const CATEGORY_COLORS = [
  "#4a3728", "#2e4a40", "#2e3a4a", "#4a2e3a",
  "#3a4a2e", "#4a4a2e", "#2e2e4a", "#4a3a2e",
];

const MenuContainer = () => {
  const dispatch = useDispatch();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    const unsubscribe = subscribeToProducts(
      (data) => {
        const inStock = data.filter((p) => p.stock > 0);
        setProducts(inStock);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsubscribe;
  }, []);

  const categories = useMemo(() => {
    const cats = [...new Set(products.map((p) => p.category).filter(Boolean))].sort();
    return cats;
  }, [products]);

  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
    }
  }, [categories]);

  const categoryItems = useMemo(() => {
    if (!selectedCategory) return [];
    return products.filter((p) => p.category === selectedCategory);
  }, [products, selectedCategory]);

  const getQty = (id) => quantities[id] ?? 0;

  const increment = (id) => setQuantities((prev) => ({ ...prev, [id]: Math.min((prev[id] ?? 0) + 1, 10) }));
  const decrement = (id) => setQuantities((prev) => ({ ...prev, [id]: Math.max((prev[id] ?? 0) - 1, 0) }));

  const handleAddToCart = (item) => {
    const qty = getQty(item.id);
    if (qty === 0) return;
    dispatch(addItems({
      id: item.id,
      name: item.name,
      pricePerQuantity: item.price,
      quantity: qty,
      price: item.price * qty,
    }));
    setQuantities((prev) => ({ ...prev, [item.id]: 0 }));
  };

  if (loading) {
    return <p className="text-[#ababab] text-center mt-20">Loading menu…</p>;
  }

  if (categories.length === 0) {
    return <p className="text-[#ababab] text-center mt-20">No menu items available yet.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-4 gap-4 px-10 py-4">
        {categories.map((cat, i) => {
          const itemCount = products.filter((p) => p.category === cat).length;
          const bg = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
          return (
            <div
              key={cat}
              onClick={() => { setSelectedCategory(cat); setQuantities({}); }}
              className="flex flex-col items-start justify-between p-4 rounded-lg h-[100px] cursor-pointer"
              style={{ backgroundColor: bg }}
            >
              <div className="flex items-center justify-between w-full">
                <h1 className="text-[#f5f5f5] text-lg font-semibold">{cat}</h1>
                {selectedCategory === cat && <GrRadialSelected className="text-white" size={20} />}
              </div>
              <p className="text-[#ababab] text-sm font-semibold">{itemCount} Item{itemCount !== 1 ? "s" : ""}</p>
            </div>
          );
        })}
      </div>

      <hr className="border-[#2a2a2a] border-t-2 mt-4" />

      <div className="grid grid-cols-4 gap-4 px-10 py-4">
        {categoryItems.map((item) => {
          const qty = getQty(item.id);
          return (
            <div key={item.id} className="flex flex-col items-start justify-between p-4 rounded-lg h-[170px] bg-[#1a1a1a] hover:bg-[#2a2a2a] transition">
              <div className="flex items-start justify-between w-full">
                <div className="flex-1 pr-2">
                  <h1 className="text-[#f5f5f5] text-base font-semibold leading-tight">{item.name}</h1>
                  {item.stock <= 5 && (
                    <p className="text-orange-400 text-xs mt-0.5">Only {item.stock} left</p>
                  )}
                </div>
                <button
                  onClick={() => handleAddToCart(item)}
                  disabled={qty === 0}
                  className="bg-[#2e4a40] text-[#02ca3a] p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <FaShoppingCart size={18} />
                </button>
              </div>

              <div className="w-full">
                <p className="text-[#f5f5f5] text-xl font-bold mb-2">₱{item.price.toLocaleString("en-PH")}</p>
                <div className="flex items-center justify-between bg-[#1f1f1f] px-4 py-2 rounded-lg gap-4">
                  <button onClick={() => decrement(item.id)} className="text-yellow-500 text-2xl font-bold leading-none">&minus;</button>
                  <span className="text-white text-base">{qty}</span>
                  <button onClick={() => increment(item.id)} className="text-yellow-500 text-2xl font-bold leading-none">&#43;</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default MenuContainer;
