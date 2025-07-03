import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import ImageClassifier from "@/pages/image-classifier";
import SoundClassifier from "@/pages/sound-classifier";
import PoseClassifier from "@/pages/pose-classifier";
import Gallery from "@/pages/gallery";
import Help from "@/pages/help";
import NotFound from "@/pages/not-found";
import Header from "@/components/header";
import Footer from "@/components/footer";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/image-classifier" component={ImageClassifier} />
      <Route path="/sound-classifier" component={SoundClassifier} />
      <Route path="/pose-classifier" component={PoseClassifier} />
      <Route path="/gallery" component={Gallery} />
      <Route path="/help" component={Help} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-br from-light-gray to-white">
          <Header />
          <Router />
          <Footer />
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
