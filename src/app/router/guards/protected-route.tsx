import { Outlet } from "react-router-dom";

/** Authentication enforcement will be connected when the session API is available. */
export const ProtectedRoute = () => <Outlet />;
