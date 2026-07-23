"use client";
import { useEffect, useState } from "react";
import Nologin from "./components/Nologin";
import Home from "./components/Home";

export default function HomePage() {
  const [status, setStatus] = useState("loading");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = window.localStorage.getItem("access_token");

      if (!accessToken) {
        setStatus("unauthenticated");
        return;
      }

      try {
        const apiBaseUrl =
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

        const response = await fetch(`${apiBaseUrl}/api/auth/user`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          window.localStorage.removeItem("access_token");
          setUser(null);
          setStatus("unauthenticated");
          return;
        }

        const data = await response.json();
        setUser(data);
        setStatus("authenticated");
      } catch (error) {
        window.localStorage.removeItem("access_token");
        setUser(null);
        setStatus("unauthenticated");
      }
    };

    checkAuth();
  }, []);

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F6F8FC] px-6 text-[#5F6368]">
        <div className="rounded-2xl border border-[#DADCE0] bg-white px-6 py-4 shadow-sm">
          Checking your session...
        </div>
      </main>
    );
  }

  if (status === "authenticated") {
    
    return <Home user={user} />;
  }

  return <Nologin />;
}
