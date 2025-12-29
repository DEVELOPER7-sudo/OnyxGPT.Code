import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import IndexPage from "./pages/Index";
import EditorPage from "./pages/EditorPage";

const App = () => (
  <TooltipProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/project/:projectId" element={<EditorPage />} />
      </Routes>
    </BrowserRouter>
    <Toaster position="top-right" richColors />
  </TooltipProvider>
);

export default App;
