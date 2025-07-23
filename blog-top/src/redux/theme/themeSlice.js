import { createSlice } from '@reduxjs/toolkit';

// const savedTheme = localStorage.getItem('theme') || 'light';

const initialState = {
  theme: 'light',
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', state.theme);  // Save to localStorage
    },
  },
});

export const { toggleTheme } = themeSlice.actions;

export default themeSlice.reducer;