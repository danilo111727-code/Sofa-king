import { Component, useEffect, useRef, useState } from "react";
  import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
  import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
  import { ClerkProvider, SignIn, SignUp, useClerk, useAuth } from "@clerk/react";
  import { Toaster } from "@/components/ui/toaster";
  import { TooltipProvider } from "@/components/ui/tooltip";
  import NotFound from "@/pages/not-found";
  import Home from "@/pages/Home";
  import Modelos from "@/pages/Modelos";
  import Produto from "@/pages/Produto";
  import Carrinho from "@/pages/Carrinho";
  import Admin from "@/pages/Admin";
  import AdminLogin from "@/pages/AdminLogin";
  import Favoritos from "@/pages/Favoritos";
  import { WhatsAppButton } from "@/components/WhatsAppButton";
  import { CartProvider } from "@/contexts/CartContext";
  import { SiteSettingsProvider } from "@/contexts/SiteSettingsContext";

  const queryClient = new QueryClient();

  const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  function stripBase(path: string): string {
    return basePath && path.startsWith(basePath)
      ? path.slice(basePath.length) || "/"
      : path;
  }

  // Error boundary to catch Clerk initialization errors
  class ClerkErrorBoundary extends Component<
    { fallback: React.ReactNode; children: React.ReactNode },
    { hasError: boolean }
  > {
    constructor(props: any) {
      super(props);
      this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
      return { hasError: true };
    }
    render() {
      if (this.state.hasError) return this.props.fallback;
      return this.props.children;
    }
  }

  function SignInPage() {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
        <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} fallbackRedirectUrl={`${basePath}/`} />
      </div>
    );
  }

  function SignUpPage() {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
        <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} fallbackRedirectUrl={`${basePath}/`} />
      </div>
    );
  }

  function ClerkQueryClientCacheInvalidator() {
    const { addListener } = useClerk();
    const qc = useQueryClient();
    const prevUserIdRef = useRef<string | null | undefined>(undefined);

    useEffect(() => {
      const unsubscribe = addListener(({ user }) => {
        const userId = user?.id ?? null;
        if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
          qc.clear();
        }
        prevUserIdRef.current = userId;
      });
      return unsubscribe;
    }, [addListener, qc]);

    return null;
  }

  // Renders children after Clerk loads OR after 4s timeout — never blank
  function ClerkSafeContent({ children }: { children: React.ReactNode }) {
    const { isLoaded } = useAuth();
    const [timedOut, setTimedOut] = useState(false);

    useEffect(() => {
      const t = setTimeout(() => setTimedOut(true), 4000);
      return () => clearTimeout(t);
    }, []);

    if (!isLoaded && !timedOut) return null;
    return <>{children}</>;
  }

  function Router() {
    return (
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/modelos" component={Modelos} />
        <Route path="/produto/:id" component={Produto} />
        <Route path="/carrinho" component={Carrinho} />
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
        <Route path="/favoritos" component={Favoritos} />
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin" component={Admin} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  function WhatsAppOnPublic() {
    const [location] = useLocation();
    if (location.startsWith("/admin") || location.startsWith("/sign-")) return null;
    return <WhatsAppButton />;
  }

  function AppContent() {
    return (
      <QueryClientProvider client={queryClient}>
        <SiteSettingsProvider>
          <CartProvider>
            <TooltipProvider>
              <Router />
              <WhatsAppOnPublic />
              <Toaster />
            </TooltipProvider>
          </CartProvider>
        </SiteSettingsProvider>
      </QueryClientProvider>
    );
  }

  function ClerkProviderWithRoutes() {
    const [, setLocation] = useLocation();

    if (!clerkPubKey) return <AppContent />;

    return (
      <ClerkErrorBoundary fallback={<AppContent />}>
        <ClerkProvider
          publishableKey={clerkPubKey}
          proxyUrl={clerkProxyUrl}
          routerPush={(to) => setLocation(stripBase(to))}
          routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
        >
          <QueryClientProvider client={queryClient}>
            <ClerkQueryClientCacheInvalidator />
            <SiteSettingsProvider>
              <CartProvider>
                <TooltipProvider>
                  <ClerkSafeContent>
                    <Router />
                    <WhatsAppOnPublic />
                    <Toaster />
                  </ClerkSafeContent>
                </TooltipProvider>
              </CartProvider>
            </SiteSettingsProvider>
          </QueryClientProvider>
        </ClerkProvider>
      </ClerkErrorBoundary>
    );
  }

  function App() {
    return (
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
    );
  }

  export default App;
  