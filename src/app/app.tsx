import { RouterProvider } from "react-router-dom";
import { appRouter } from "@/app/router/app-router";

export const App = () => <RouterProvider router={appRouter} />;
