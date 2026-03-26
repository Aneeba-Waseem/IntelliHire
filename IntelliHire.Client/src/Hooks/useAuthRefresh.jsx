import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { refreshAccessToken } from "../api/authFetch";
import { saveAuthState } from "../features/auth/persistAuth";
import { setAccessToken } from "../features/auth/authSlice"; // Adjust path to your auth slice

const TOKEN_REFRESH_INTERVAL_MS = 1 * 60 * 1000; // 14 minutes

export default function useAuthRefresh(accessToken) {
    const dispatch = useDispatch();
    const refreshTimerRef = useRef(null);
    const authState = useSelector((state) => state.auth); // Select only auth slice

    const scheduleRefresh = (token) => {
        // Clear any existing timer
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
        }

        // Schedule the refresh
        refreshTimerRef.current = setTimeout(async () => {
            console.log("Proactive token refresh at 14th minute with the token: ", token);
            try {
                const newToken = await refreshAccessToken();
                console.log("Token refreshed successfully");
                
                // Dispatch Redux action instead of mutating state
                dispatch(setAccessToken(newToken));
                
                // Update localStorage
                const updatedState = { auth: { user: authState.user, accessToken: newToken}};
                console.log("updated state: ", updatedState);
                saveAuthState(updatedState);
                
                // Reschedule for next refresh
                scheduleRefresh(newToken);
            } catch (error) {
                console.error("Token refresh failed:", error);
                // Redirect happens inside refreshAccessToken
            }
        }, TOKEN_REFRESH_INTERVAL_MS);
    };

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
        // Start the refresh schedule when token is available
        scheduleRefresh(token);

        // Cleanup on unmount or when token changes
        return () => {
            if (refreshTimerRef.current) {
                clearTimeout(refreshTimerRef.current);
            }
        };
    }, [accessToken, dispatch]); // Include dispatch in dependencies
}