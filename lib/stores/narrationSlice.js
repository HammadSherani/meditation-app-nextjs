import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunk for fetching narrations
export const fetchNarrations = createAsyncThunk(
  'narrations/fetchNarrations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/get-narrations');
      const data = await response.json();
      
      if (data.success) {
        return data.narrations;
      } else {
        return rejectWithValue(data.message || 'Failed to fetch narrations');
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const narrationSlice = createSlice({
  name: 'narrations',
  initialState: {
    narrations: [],
    isLoading: false,
    error: null,
  },
  reducers: {
    addNarration: (state, action) => {
      state.narrations.unshift(action.payload);
    },
    updateNarration: (state, action) => {
      const { id, updatedData } = action.payload;
      const narration = state.narrations.find(
        (n) => n._id === id || n.id === id
      );
      if (narration) {
        Object.assign(narration, updatedData);
      }
    },
    deleteNarration: (state, action) => {
      state.narrations = state.narrations.filter(
        (n) => n._id !== action.payload && n.id !== action.payload
      );
    },
    clearNarrations: (state) => {
      state.narrations = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNarrations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNarrations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.narrations = action.payload;
        state.error = null;
      })
      .addCase(fetchNarrations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { addNarration, updateNarration, deleteNarration, clearNarrations } = narrationSlice.actions;
export default narrationSlice.reducer;
