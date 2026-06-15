import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Vehicles from "@/pages/Vehicles";
import Refuel from "@/pages/Refuel";
import Maintenance from "@/pages/Maintenance";
import Analysis from "@/pages/Analysis";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/vehicles" replace />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/refuel" element={<Refuel />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/analysis" element={<Analysis />} />
        </Routes>
      </Layout>
    </Router>
  );
}
