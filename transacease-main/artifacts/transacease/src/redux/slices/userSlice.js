import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: { _id: "", name: "", email: "", phone: "", role: "", isAuth: false },
  reducers: {
    setUser: (state, action) => {
      const { _id, name, phone, email, role } = action.payload;
      // Firestore uses 'id' not '_id' — support both
      state._id = _id || action.payload.id || "";
      state.name = name;
      state.phone = phone;
      state.email = email;
      state.role = role;
      state.isAuth = true;
    },
    removeUser: (state) => {
      state._id = ""; state.email = ""; state.name = "";
      state.phone = ""; state.role = ""; state.isAuth = false;
    },
  },
});

export const { setUser, removeUser } = userSlice.actions;
export default userSlice.reducer;
