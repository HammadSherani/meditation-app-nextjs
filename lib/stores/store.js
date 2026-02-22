import { configureStore } from '@reduxjs/toolkit';
import narrationReducer from './narrationSlice';

export const store = configureStore({
  reducer: {
    narrations: narrationReducer,
  },
});
