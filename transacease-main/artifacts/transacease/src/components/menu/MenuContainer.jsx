import React, { useEffect, useState, useMemo } from "react";
import { GrRadialSelected } from "react-icons/gr";
import { IoMdClose } from "react-icons/io";
import { useDispatch } from "react-redux";
import { addItems } from "../../redux/slices/cartSlice";
import { subscribeToProducts } from "../../services/productService";

const CATEGORY_COLORS = [
  "#4a3728", "#2e4a40", "#2e3a4a", "#4a2e3a",
  "#3a4a2e", "#4a4a2e", "#2e2e4a", "#4a3a2e",
];

const COMMON_EXTRAS = [
  "Extra Patty", "Extra Cheese", "Extra Sauce",
  "No Bun", "No Tomato", "No Onion", "No Lettuce",
  "Extra Rice", "No Spice", "Extra Spicy",
  "Less Sugar", "No Ice", "Extra Gravy",
];

const CustomizeModal = ({ item, onClose, onConfirm }) => {
  const [qty, setQty] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [note, setNote] = useState("");

  const toggleExtra = (extra) => {
    setSelectedExtras((prev) =>
      prev.includes(extra) ? prev.filter((e) => e !== extra) : [...prev, extra]
    );
  };

  const handleConfirm = () => {
    const customization = [...selectedExtras, ...(note.trim() ? [note.trim()] : [])].join(", ");
    onConfirm({ item, qty, customization });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#2a2a2a] p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">

        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-white text-xl font-bold">{item.name}</h2>
            <p className="text-[#f6b100] font-bold text-lg mt-0.5">₱{item.price.toLocaleString("en-PH")}</p>
          </div>
          <button onClick={onClose} className="text-[#ababab] hover:text-white mt-1">
            <IoMdClose size={22} />
          </button>
        </div>

        <div>
          <p className="text-[#ababab] text-sm font-semibold mb-2">Customize your order</p>
          <div className="flex flex-wrap gap-2">
            {COMMON_EXTRAS.map((extra) => (
              <button
                key={extra}
                onClick={() => toggleExtra(extra)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition ${
                  selectedExtras.includes(extra)
                    ? "bg-[#f6b100] text-[#1f1f1f] border-[#f6b100]"
                    : "bg-[#1f1f1f] text-[#ababab] border-[#383838] hover:border-[#f6b100] hover:text-white"
                }`}
              >
                {selectedExtras.includes(extra) ? "✓ " : ""}{extra}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[#ababab] text-sm font-semibold mb-2">Special instructions</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. No onions, extra sauce on the side…"
            rows={2}
            className="w-full bg-[#1f1f1f] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#f6b100] resize-none placeholder-[#555]"
          />
        </div>

        <div>
          <p className="text-[#ababab] text-sm font-semibold mb-2">Quantity</p>
          <div className="flex items-center gap-4 bg-[#1f1f1f] rounded-xl px-4 py-3 w-fit">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="text-[#f6b100] text-2xl font-bold leading-none">&minus;</button>
            <span className="text-white text-lg font-bold w-6 text-center">{qty}</span>
            <button onClick={() => setQty((q) => Math.min(item.stock, q + 1))} className="text-[#f6b100] text-2xl font-bold leading-none">&#43;</button>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-[#383838] py-3 text-sm font-semibold text-[#ababab] hover:text-white">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 rounded-xl bg-[#f6b100] py-3 text-sm font-bold text-[#1f1f1f]"
          >
            Add to Cart · ₱{(item.price * qty).toLocaleString("en-PH")}
          </button>
        </div>
      </div>
    </div>
  );
};

const MenuContainer = () => {
  const dispatch = useDispatch();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [customizing, setCustomizing] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToProducts(
      (data) => { setProducts(data.filter((p) => p.stock > 0)); setLoading(false); },
      () => setLoading(false),
    );
    return unsubscribe;
  }, []);

  const categories = useMemo(() => [...new Set(products.map((p) => p.category).filter(Boolean))].sort(), [products]);

  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) setSelectedCategory(categories[0]);
  }, [categories]);

  const categoryItems = useMemo(() => {
    if (!selectedCategory) return [];
    return products.filter((p) => p.category === selectedCategory);
  }, [products, selectedCategory]);

  const handleConfirm = ({ item, qty, customization }) => {
    dispatch(addItems({
      id: item.id + "_" + Date.now(),
      name: item.name,
      pricePerQuantity: item.price,
      quantity: qty,
      price: item.price * qty,
      customization: customization || "",
    }));
  };

  if (loading) return <p className="text-[#ababab] text-center mt-20">Loading menu…</p>;
  if (categories.length === 0) return <p className="text-[#ababab] text-center mt-20">No menu items available yet.</p>;

  return (
    <>
      <div className="grid grid-cols-4 gap-4 px-10 py-4">
        {categories.map((cat, i) => {
          const count = products.filter((p) => p.category === cat).length;
          return (
            <div key={cat} onClick={() => setSelectedCategory(cat)}
              className="flex flex-col items-start justify-between p-4 rounded-lg h-[100px] cursor-pointer"
              style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}>
              <div className="flex items-center justify-between w-full">
                <h1 className="text-[#f5f5f5] text-lg font-semibold">{cat}</h1>
                {selectedCategory === cat && <GrRadialSelected className="text-white" size={20} />}
              </div>
              <p className="text-[#ababab] text-sm font-semibold">{count} Item{count !== 1 ? "s" : ""}</p>
            </div>
          );
        })}
      </div>

      <hr className="border-[#2a2a2a] border-t-2 mt-4" />

      <div className="grid grid-cols-4 gap-4 px-10 py-4">
        {categoryItems.map((item) => (
          <div
            key={item.id}
            onClick={() => setCustomizing(item)}
            className="flex flex-col items-start justify-between p-4 rounded-lg h-[130px] bg-[#1a1a1a] hover:bg-[#2a2a2a] transition cursor-pointer"
          >
            <div>
              <h1 className="text-[#f5f5f5] text-base font-semibold leading-tight">{item.name}</h1>
              {item.stock <= 5 && <p className="text-orange-400 text-xs mt-0.5">Only {item.stock} left</p>}
            </div>
            <div className="w-full flex items-center justify-between">
              <p className="text-[#f5f5f5] text-xl font-bold">₱{item.price.toLocaleString("en-PH")}</p>
              <span className="text-xs text-[#ababab] bg-[#2e4a40] text-[#02ca3a] px-2 py-1 rounded-lg">Tap to order</span>
            </div>
          </div>
        ))}
      </div>

      {customizing && (
        <CustomizeModal
          item={customizing}
          onClose={() => setCustomizing(null)}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
};

export default MenuContainer;
