import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from './authSlice';
import { courseReducer } from './courseSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    courses: courseReducer
  }
});

export default store;

