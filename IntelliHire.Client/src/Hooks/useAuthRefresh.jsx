import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { refreshAccessToken, logoutUser } from "../features/auth/authThunks";

export default function useAuthRefresh() {
    const dispatch = useDispatch();
    const accessToken = useSelector((state) => state.auth.accessToken);

    useEffect(() => {
        if (!accessToken) return;

        const interval = setInterval(() => {
            dispatch(refreshAccessToken(accessToken)).unwrap().catch(() => {
                // If refresh fails, log out user
                dispatch(logoutUser());
            });
        }, 14 * 60 * 1000); // every 14 minutes

        return () => clearInterval(interval);
    }, [accessToken, dispatch]);
}
