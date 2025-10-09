import logo from './logo.svg';
import './App.css';

import { queryClient } from './components/queryClient';
import { QueryClientProvider } from "@tanstack/react-query";
import AccessibleWeatherApp from './components/weather';
import { ThemeProvider } from './components/themeProvider';
import { TooltipProvider } from './components/ui/tooltipProvider';
import { Toaster } from './components/ui/toaster';
import { Switch, Route } from "wouter";
import Home from './components/home';
import NotFound from './components/notFound';

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}
function App() {
  return (
    <>
      <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      
          <Toaster />
          < Router/>
       
      </ThemeProvider>
      </QueryClientProvider>

    </>
  );
}

export default App;
