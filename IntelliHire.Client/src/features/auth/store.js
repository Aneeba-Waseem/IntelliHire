import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import { loadAuthState, saveAuthState } from "./persistAuth";

const preloadedState = { auth: loadAuthState() };

export const store = configureStore({
    reducer: {
        auth: authReducer,
    },
    preloadedState,
});

// Subscribe to save state changes
store.subscribe(() => {
    saveAuthState(store.getState().auth);
});
