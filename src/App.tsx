import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import IndexPage from "./pages/Index";
import EditorPage from "./pages/EditorPage";

// You can keep Toaster and other providers if you plan to use them.
// I've removed QueryClientProvider for now as we aren't fetching data yet.

const App = () => (
  <TooltipProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/project/:projectId" element={<EditorPage />} />
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
