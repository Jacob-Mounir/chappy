import { useEffect } from "react";
import { useStore } from "./store/useStore";
import { MainLayout } from "./components/MainLayout";
import { ThemeProvider } from "./components/ThemeProvider";
import "./index.css";

export function App() {
  const { error } = useStore();

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      useStore.getState().setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground">
        {error && (
          <div className="p-4 bg-destructive text-destructive-foreground">
            {error}
          </div>
        )}
        <MainLayout />
      </div>
    </ThemeProvider>
  );
}
