import { useEffect } from "react";
import { useLocation, Redirect } from "wouter";
import { Show } from "@clerk/react";

export default function AdminLogin() {
  const [, navigate] = useLocation();

  useEffect(() => {
    navigate("/sign-in", { replace: true });
  }, [navigate]);

  return (
    <>
      <Show when="signed-in">
        <Redirect to="/admin" />
      </Show>
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        Redirecionando para o login…
      </div>
    </>
  );
}
