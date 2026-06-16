import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  courses: [],
  selectedCourse: null,
  loading: false,
  error: null
};

const courseSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    fetchCoursesStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchCoursesSuccess: (state, action) => {
      state.loading = false;
      state.courses = action.payload;
    },
    fetchCoursesFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    selectCourse: (state, action) => {
      state.selectedCourse = action.payload;
    },
    clearSelectedCourse: (state) => {
      state.selectedCourse = null;
    }
  }
});

export const {
  fetchCoursesStart,
  fetchCoursesSuccess,
  fetchCoursesFailure,
  selectCourse,
  clearSelectedCourse
} = courseSlice.actions;

export const courseReducer = courseSlice.reducer;

