import { createSlice } from "@reduxjs/toolkit";

const initialState: {
  loading: boolean,
  initialized: boolean,
  user: {
    login: string,
    offers_access: boolean,
    role: string,
    telegram_user_id: number
  } | null
} = {
  loading: false,
  initialized: false,
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState: initialState,
  reducers: {
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setUser(state, action) {
      state.user = action.payload;
    },
    setInitialized(state, action) {
      state.initialized = action.payload;
    },
  }
});

export const { setLoading, setUser, setInitialized } = authSlice.actions;

export default authSlice.reducer;