import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Hero from "./pages/Hero";
import ClimateMap from "./pages/ClimateMap";
import AskKilimoPRO from "./pages/AskKilimoPRO";
import DiseaseDetection from "./pages/DiseaseDetection";
import AlertsFeed from "./pages/AlertsFeed";
import MarketIntelligence from "./pages/MarketIntelligence";
import EducationHub from "./pages/EducationHub";
import FarmerProfile from "./pages/FarmerProfile";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/ "} component={Hero} />
      <Route path={"/map"} component={ClimateMap} />
      <Route path={"/chat"} component={AskKilimoPRO} />
      <Route path={"/disease"} component={DiseaseDetection} />
      <Route path={"/alerts"} component={AlertsFeed} />
      <Route path={"/market"} component={MarketIntelligence} />
      <Route path={"/education"} component={EducationHub} />
      <Route path={"/profile"} component={FarmerProfile} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
