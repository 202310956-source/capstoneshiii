export const getBgColor = () => {
  const bgarr = [
    "#b73e3e","#5b45b0","#7f167f","#735f32",
    "#1d2569","#285430","#f6b100","#025cca","#be3e3f","#02ca3a",
  ];
  return bgarr[Math.floor(Math.random() * bgarr.length)];
};

export const getAvatarName = (name) => {
  if (!name) return "";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase();
};

export const formatDate = (date) => {
  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];
  return `${months[date.getMonth()]} ${String(date.getDate()).padStart(2,"0")}, ${date.getFullYear()}`;
};

export const formatDateAndTime = (date) =>
  new Date(date).toLocaleString("en-US", {
    month: "long", day: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: true, timeZone: "Asia/Kolkata",
  });
