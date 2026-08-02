import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  isCreateModalOpen: boolean;
  selectedTaskId: string | null;
  editingTask: any | null;
  searchQuery: string;
  statusFilter: string;
  priorityFilter: string;
  currentPage: number;
}

const initialState: UIState = {
  isCreateModalOpen: false,
  selectedTaskId: null,
  editingTask: null,
  searchQuery: '',
  statusFilter: '',
  priorityFilter: '',
  currentPage: 1,
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
    setEditingTask: (state, action: PayloadAction<any | null>) => {
      state.editingTask = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      state.currentPage = 1;
    },
    setStatusFilter: (state, action: PayloadAction<string>) => {
      state.statusFilter = action.payload;
      state.currentPage = 1;
    },
    setPriorityFilter: (state, action: PayloadAction<string>) => {
      state.priorityFilter = action.payload;
      state.currentPage = 1;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
  },
});

export const {
  toggleCreateModal,
  setSelectedTaskId,
  setEditingTask,
  setSearchQuery,
  setStatusFilter,
  setPriorityFilter,
  setCurrentPage,
} = uiSlice.actions;

export default uiSlice.reducer;
