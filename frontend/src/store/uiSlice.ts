import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  isCreateModalOpen: boolean;
  selectedTaskId: string | null;
  searchQuery: string;
  statusFilter: string;
  priorityFilter: string;
}
//2 states banayi hai ek user details aur sessions hai bo store kar raha hai doosra hamari search filter modal open ye sab save kar raha hai

const initialState: UIState = {
  isCreateModalOpen: false,
  selectedTaskId: null,
  searchQuery: '',
  statusFilter: '',
  priorityFilter: '',
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleCreateModal: (state, action: PayloadAction<boolean>) => {
      state.isCreateModalOpen = action.payload;
    },
    setSelectedTaskId: (state, action: PayloadAction<string | null>) => {
      state.selectedTaskId = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setStatusFilter: (state, action: PayloadAction<string>) => {
      state.statusFilter = action.payload;
    },
    setPriorityFilter: (state, action: PayloadAction<string>) => {
      state.priorityFilter = action.payload;
    },
  },
});

export const {
  toggleCreateModal,
  setSelectedTaskId,
  setSearchQuery,
  setStatusFilter,
  setPriorityFilter,
} = uiSlice.actions;

export default uiSlice.reducer;
