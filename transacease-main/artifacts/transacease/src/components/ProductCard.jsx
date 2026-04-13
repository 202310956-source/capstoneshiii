import React from "react";

const ProductCard = ({ product, onAdd }) => {
  const imageUrl = product.image || "https://placehold.co/600x400/f6f6f6/333333?text=No+Image";
  const isOutOfStock = product.stock <= 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <img src={imageUrl} alt={product.name} className="h-32 w-full rounded-lg object-cover" />
      <h3 className="mt-3 text-lg font-semibold text-gray-800">{product.name}</h3>
      <p className="mt-1 text-sm text-gray-600">{product.category}</p>
      <p className="mt-1 text-xs text-gray-500">{isOutOfStock ? "Out of stock" : `${product.stock} left in stock`}</p>
      <p className="mt-1 text-xl font-bold text-[#E53935]">PHP {product.price.toFixed(2)}</p>
      <button
        disabled={isOutOfStock}
        onClick={() => onAdd(product)}
        className="mt-3 w-full rounded-lg bg-[#FFD23F] px-4 py-2 font-semibold text-black hover:bg-[#e0b235] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isOutOfStock ? "Unavailable" : "Add"}
      </button>
    </div>
  );
};

export default ProductCard;
