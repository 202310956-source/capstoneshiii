import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RiDeleteBin2Fill, RiShoppingCart2Fill } from "react-icons/ri";
import { FaShoppingBag, FaReceipt } from "react-icons/fa";
import { IoClose as IoCloseIo } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { removeItem, getTotalPrice } from "../../redux/slices/cartSlice";
import Bill from "./Bill";

const CartSidebar = ({ isOpen, onClose }) => {
  const cartData = useSelector((state) => state.cart);
  const total = useSelector(getTotalPrice);
  const dispatch = useDispatch();
  const scrollRef = useRef();
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [cartData, isOpen]);

  useEffect(() => {
    if (!isOpen) setShowCheckout(false);
  }, [isOpen]);

  const itemCount = cartData.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const tax = (total * 5.25) / 100;
  const subtotalWithTax = total + tax;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="sidebar"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed top-0 right-0 h-full w-[380px] bg-[#171717] z-50 flex flex-col shadow-2xl border-l border-[#2a2a2a]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#252525] flex-shrink-0">
              <div className="flex items-center gap-3">
                <RiShoppingCart2Fill className="text-[#f6b100]" size={20} />
                <h2 className="text-[#f5f5f5] font-bold tracking-wide">
                  {showCheckout ? "Checkout" : "Your Cart"}
                </h2>
                {itemCount > 0 && !showCheckout && (
                  <span className="bg-[#f6b100] text-[#1a1a1a] text-xs font-bold px-2 py-0.5 rounded-full">
                    {itemCount} items
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {showCheckout && (
                  <button onClick={() => setShowCheckout(false)}
                    className="text-[#686868] hover:text-[#ababab] text-xs font-semibold transition-colors px-2 py-1 rounded-lg border border-[#2a2a2a]">
                    ← Back
                  </button>
                )}
                <button onClick={onClose} className="text-[#686868] hover:text-white transition-colors p-1">
                  <IoCloseIo size={22} />
                </button>
              </div>
            </div>

            {!showCheckout ? (
              <>
                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-3" ref={scrollRef}>
                  {cartData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16">
                      <FaShoppingBag className="text-[#2a2a2a]" size={72} />
                      <p className="text-[#ababab] text-sm font-medium">Your cart is empty</p>
                      <p className="text-[#444] text-xs">Add items from the menu to get started.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {cartData.map((item) => {
                        const unitPrice = item.pricePerQuantity ?? (item.price / (item.quantity || 1));
                        return (
                          <div key={item.id} className="bg-[#1f1f1f] rounded-xl px-4 py-3 border border-[#272727] flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-[#e4e4e4] font-semibold text-sm truncate">{item.name}</h3>
                              <p className="text-[#686868] text-xs mt-1">
                                ₹{unitPrice.toFixed(2)} × {item.quantity}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <span className="text-[#f5f5f5] font-bold text-sm">₹{item.price.toFixed(2)}</span>
                              <button onClick={() => dispatch(removeItem(item.id))}
                                className="text-[#444] hover:text-red-400 transition-colors">
                                <RiDeleteBin2Fill size={16} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Cart Footer */}
                {cartData.length > 0 && (
                  <div className="border-t border-[#252525] px-5 py-4 space-y-3 flex-shrink-0">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#686868]">Subtotal ({itemCount} items)</span>
                        <span className="text-[#f5f5f5] font-semibold">₹{total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#686868]">Tax (5.25%)</span>
                        <span className="text-[#f5f5f5] font-semibold">₹{tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-baseline pt-2 border-t border-[#252525]">
                        <span className="text-[#f5f5f5] font-bold">Estimated Total</span>
                        <span className="text-[#f6b100] font-bold text-lg">₹{subtotalWithTax.toFixed(2)}</span>
                      </div>
                    </div>
                    <button onClick={() => setShowCheckout(true)}
                      className="w-full bg-[#f6b100] text-[#1a1a1a] py-3 rounded-xl font-bold text-base hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2">
                      <FaReceipt size={16} />
                      Proceed to Checkout
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* Checkout / Bill Panel */
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                <Bill />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export const CartToggleButton = ({ onClick }) => {
  const cartData = useSelector((state) => state.cart);
  const itemCount = cartData.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <button onClick={onClick}
      className="relative flex items-center gap-2 bg-[#252525] hover:bg-[#2f2f2f] text-[#f5f5f5] px-4 py-2 rounded-xl transition-colors border border-[#333]">
      <RiShoppingCart2Fill size={18} className="text-[#f6b100]" />
      <span className="text-sm font-semibold">Cart</span>
      {itemCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-[#f6b100] text-[#1a1a1a] text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
          {itemCount > 9 ? "9+" : itemCount}
        </span>
      )}
    </button>
  );
};

export default CartSidebar;
