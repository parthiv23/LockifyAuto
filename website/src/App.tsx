import { Route, Switch, useLocation, Router as WouterRouter } from "wouter";
import { ErrorBoundary } from "@/components/error-boundary";
import { RedirectToApp } from "@/components/redirect-to-app";
import { ThemeProvider } from "@/lib/theme";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import Privacy from "@/pages/privacy";

function Router() {
  const [location] = useLocation();
  return (
    <ErrorBoundary resetKey={location}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/login">{() => <RedirectToApp path="/login" />}</Route>
        <Route path="/register">{() => <RedirectToApp path="/register" />}</Route>
        <Route path="/forgot-password">{() => <RedirectToApp path="/forgot-password" />}</Route>
        <Route path="/vault">{() => <RedirectToApp path="/" />}</Route>
        <Route component={NotFound} />
      </Switch>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <ThemeProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
    </ThemeProvider>
  );
}

export default App;
