import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

// Department Pages
import ComputerEngineering from "./pages/departments/ComputerEngineering";
import InformationTechnology from "./pages/departments/InformationTechnology";
import ElectronicsCommunication from "./pages/departments/ElectronicsCommunication";
import CivilEngineering from "./pages/departments/CivilEngineering";
import MechanicalEngineering from "./pages/departments/MechanicalEngineering";
import MBA from "./pages/departments/MBA";
import MCA from "./pages/departments/MCA";

// Cells & Centers Pages
import InternationalRelations from "./pages/cells/InternationalRelations";
import WomenEntrepreneurship from "./pages/cells/WomenEntrepreneurship";
import WomenDevelopment from "./pages/cells/WomenDevelopment";
import ResearchCell from "./pages/cells/ResearchCell";
import Library from "./pages/cells/Library";
import AntiRaggingCell from "./pages/cells/AntiRaggingCell";
import SportsCell from "./pages/cells/SportsCell";
import SocialResponsibility from "./pages/cells/SocialResponsibility";
import LakshCell from "./pages/cells/LakshCell";

// Activities Pages
import Placement from "./pages/activities/Placement";
import Sports from "./pages/activities/Sports";
import NCC from "./pages/activities/NCC";
import NSS from "./pages/activities/NSS";

// Auth Pages
import FacultyLogin from "./pages/auth/FacultyLogin";
import AdminLogin from "./pages/auth/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import FacultyDashboard from "./pages/FacultyDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            
            {/* Department Routes */}
            <Route path="/departments/computer-engineering" element={<ComputerEngineering />} />
            <Route path="/departments/information-technology" element={<InformationTechnology />} />
            <Route path="/departments/electronics-and-communication" element={<ElectronicsCommunication />} />
            <Route path="/departments/civil-engineering" element={<CivilEngineering />} />
            <Route path="/departments/mechanical-engineering" element={<MechanicalEngineering />} />
            <Route path="/departments/mba" element={<MBA />} />
            <Route path="/departments/mca" element={<MCA />} />
            
            {/* Cells & Centers Routes */}
            <Route path="/cells/department-of-international-relations" element={<InternationalRelations />} />
            <Route path="/cells/women-entrepreneurship-cell" element={<WomenEntrepreneurship />} />
            <Route path="/cells/women-development-cell" element={<WomenDevelopment />} />
            <Route path="/cells/m.-m.-patel-students-research-project-cell" element={<ResearchCell />} />
            <Route path="/cells/library" element={<Library />} />
            <Route path="/cells/anti-ragging-cell" element={<AntiRaggingCell />} />
            <Route path="/cells/sports-cell" element={<SportsCell />} />
            <Route path="/cells/social-responsibility-activities" element={<SocialResponsibility />} />
            <Route path="/cells/laksh-(university-fitness-cell)" element={<LakshCell />} />
            
            {/* Activities Routes */}
            <Route path="/activities/placement" element={<Placement />} />
            <Route path="/activities/sports" element={<Sports />} />
            <Route path="/activities/ncc" element={<NCC />} />
            <Route path="/activities/nss" element={<NSS />} />
            
            {/* Auth Routes */}
            <Route path="/faculty-login" element={<FacultyLogin />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/faculty-dashboard" element={<FacultyDashboard />} />
            


            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
