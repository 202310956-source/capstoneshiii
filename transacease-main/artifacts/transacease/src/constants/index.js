// Popular dishes — order counts start at 0 (real data comes from Firestore)
export const popularDishes = [
  { id: 1,  name: "Junior Cheeseburger w/ Fries",         numberOfOrders: 0 },
  { id: 2,  name: "Chicken Dinner",                        numberOfOrders: 0 },
  { id: 3,  name: "Spaghetti w/ Meatballs",                numberOfOrders: 0 },
  { id: 4,  name: "Super Burger",                          numberOfOrders: 0 },
  { id: 5,  name: "Porkchop Dinner",                       numberOfOrders: 0 },
  { id: 6,  name: "American Breakfast (Ham/Bacon + Egg)",  numberOfOrders: 0 },
  { id: 7,  name: "Fried Chicken (2 pcs / half)",          numberOfOrders: 0 },
  { id: 8,  name: "Pork Sisig",                            numberOfOrders: 0 },
  { id: 9,  name: "Banana Split",                          numberOfOrders: 0 },
  { id: 10, name: "Lechon Kawali",                         numberOfOrders: 0 },
];

// ─── Your Menu ───────────────────────────────────────────────────────────────

const comboMeals = [
  { id: 1, name: "Junior Cheeseburger w/ Fries", price: 120, category: "Combo Meals" },
  { id: 2, name: "Jr. Cheeseburger & Spaghetti", price: 140, category: "Combo Meals" },
  { id: 3, name: "Chicken & Spaghetti",           price: 150, category: "Combo Meals" },
];

const chickenPorkMains = [
  { id: 1, name: "Chicken Dinner",  price: 180, category: "Chicken / Pork / Mains" },
  { id: 2, name: "Porkchop Dinner", price: 200, category: "Chicken / Pork / Mains" },
  { id: 3, name: "Burger Steak",    price: 160, category: "Chicken / Pork / Mains" },
];

const noodlesPasta = [
  { id: 1, name: "Spaghetti in Beef Sauce", price: 120, category: "Noodles / Pasta" },
  { id: 2, name: "Spaghetti w/ Meatballs",  price: 140, category: "Noodles / Pasta" },
  { id: 3, name: "Pancit Canton",            price: 130, category: "Noodles / Pasta" },
];

const burgers = [
  { id: 1, name: "Junior Burger",  price: 100, category: "Burgers" },
  { id: 2, name: "Regular Burger", price: 120, category: "Burgers" },
  { id: 3, name: "Super Burger",   price: 150, category: "Burgers" },
];

const sandwiches = [
  { id: 1, name: "Clubhouse",    price: 150, category: "Sandwiches" },
  { id: 2, name: "Ham & Cheese", price: 130, category: "Sandwiches" },
  { id: 3, name: "BLT",          price: 140, category: "Sandwiches" },
];

const breakfast = [
  { id: 1, name: "American Breakfast (Ham/Bacon + Egg)", price: 160, category: "Breakfast" },
  { id: 2, name: "Chicken & Pork Adobo",                 price: 150, category: "Breakfast" },
  { id: 3, name: "Bacon & Egg Breakfast",                price: 140, category: "Breakfast" },
];

const riceSides = [
  { id: 1, name: "Fried Rice",   price: 50, category: "Rice & Sides" },
  { id: 2, name: "Garlic Rice",  price: 50, category: "Rice & Sides" },
  { id: 3, name: "French Fries", price: 70, category: "Rice & Sides" },
];

const soupsAndSalads = [
  { id: 1, name: "Chicken Mami", price: 120, category: "Soups & Salads" },
  { id: 2, name: "Beef Mami",    price: 130, category: "Soups & Salads" },
  { id: 3, name: "Chef's Salad", price: 150, category: "Soups & Salads" },
];

const shortOrders = [
  { id: 1, name: "Fried Chicken (2 pcs / half)", price: 180, category: "Short Orders" },
  { id: 2, name: "Pork Sisig",                   price: 160, category: "Short Orders" },
  { id: 3, name: "Lechon Kawali",                price: 200, category: "Short Orders" },
];

export const beverages = [
  { id: 1, name: "Iced Tea",             price: 40, category: "Beverages" },
  { id: 2, name: "Softdrinks (cup/can)", price: 50, category: "Beverages" },
  { id: 3, name: "Mango Juice",          price: 60, category: "Beverages" },
];

const iceCreamDelights = [
  { id: 1, name: "Banana Split",     price: 120, category: "Ice Cream Delights" },
  { id: 2, name: "Chocolate Sundae", price: 100, category: "Ice Cream Delights" },
  { id: 3, name: "Ice Cream Shake",  price: 130, category: "Ice Cream Delights" },
];

export const menus = [
  { id: 1,  name: "Combo Meals",            bgColor: "#b73e3e", icon: "🍔", items: comboMeals },
  { id: 2,  name: "Chicken / Pork / Mains", bgColor: "#5b45b0", icon: "🍗", items: chickenPorkMains },
  { id: 3,  name: "Noodles / Pasta",        bgColor: "#7f167f", icon: "🍝", items: noodlesPasta },
  { id: 4,  name: "Burgers",                bgColor: "#735f32", icon: "🍔", items: burgers },
  { id: 5,  name: "Sandwiches",             bgColor: "#1d2569", icon: "🥪", items: sandwiches },
  { id: 6,  name: "Breakfast",              bgColor: "#285430", icon: "🍳", items: breakfast },
  { id: 7,  name: "Rice & Sides",           bgColor: "#b73e3e", icon: "🍚", items: riceSides },
  { id: 8,  name: "Soups & Salads",         bgColor: "#5b45b0", icon: "🍲", items: soupsAndSalads },
  { id: 9,  name: "Short Orders",           bgColor: "#735f32", icon: "🍤", items: shortOrders },
  { id: 10, name: "Beverages",              bgColor: "#7f167f", icon: "🥤", items: beverages },
  { id: 11, name: "Ice Cream Delights",     bgColor: "#1d2569", icon: "🍨", items: iceCreamDelights },
];

// ─── Dashboard item counts (calculated from real menu) ───────────────────────
export const itemsData = [
  { title: "Total Categories", value: "11",  color: "#5b45b0" },
  { title: "Total Dishes",     value: menus.reduce((a, m) => a + m.items.length, 0).toString(), color: "#285430" },
  { title: "Active Orders",    value: "—",   color: "#735f32" },
  { title: "Total Tables",     value: "—",   color: "#7f167f" },
];

// metricsData intentionally removed — dashboard shows real Firestore data
