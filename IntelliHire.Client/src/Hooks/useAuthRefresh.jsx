import { useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { refreshAccessToken } from "../api/authFetch";
import { saveAuthState } from "../features/auth/persistAuth";
import { setAccessToken } from "../features/auth/authSlice";

const TOKEN_REFRESH_INTERVAL_MS = 2 * 60 * 1000; // 14 minutes

export default function useAuthRefresh(accessToken) {
    const dispatch = useDispatch();
    const refreshTimerRef = useRef(null);
    const authState = useSelector((state) => state.auth);

    // Wrap scheduleRefresh in useCallback so it has a stable reference
    const scheduleRefresh = useCallback((token) => {
        // Clear any existing timer
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
        }

        if (!token) {
            return; // No token, no timer
        }

        // Schedule the refresh
        refreshTimerRef.current = setTimeout(async () => {
            console.log("Proactive token refresh at 14th minute");
            try {
                const newToken = await refreshAccessToken();
                console.log("Token refreshed successfully");
                
                // Dispatch Redux action
                dispatch(setAccessToken(newToken));
                
                // Update localStorage with correct shape (no double nesting)
                saveAuthState({
                    user: authState.user,
                    accessToken: newToken
                });
                
                console.log("State saved, rescheduling refresh");
                // Reschedule for next refresh
                scheduleRefresh(newToken);
            } catch (error) {
                console.error("Token refresh failed:", error);
                // Don't reschedule on error — let cleanup run
                // Redirect happens inside refreshAccessToken
            }
        }, TOKEN_REFRESH_INTERVAL_MS);
    }, [authState.user, dispatch]); // Dependencies for useCallback

    useEffect(() => {
        // Check if token was passed as prop OR exists in Redux state
        const token = accessToken || authState?.accessToken;
        
        if (!token) {
            // Clear any existing timer if no token
            if (refreshTimerRef.current) {
                clearTimeout(refreshTimerRef.current);
            }
            return;
        }

        console.log("✅ Starting token refresh schedule");
        scheduleRefresh(token);

        // Cleanup on unmount or when dependencies change
        return () => {
            if (refreshTimerRef.current) {
                clearTimeout(refreshTimerRef.current);
            }
        };
    }, [accessToken, authState, scheduleRefresh]); // Include all dependencies
}