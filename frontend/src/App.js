import { useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import LandingPage from "@/pages/LandingPage";
import Dashboard from "@/pages/Dashboard";
import DrugTests from "@/pages/DrugTests";
import Meetings from "@/pages/Meetings";
import RentPayments from "@/pages/RentPayments";
import Devotions from "@/pages/Devotions";
import ReadingMaterials from "@/pages/ReadingMaterials";
import Messages from "@/pages/Messages";
import Calendar from "@/pages/Calendar";
import AdminSettings from "@/pages/AdminSettings";
import { Toaster } from "@/components/ui/sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AuthContext = React.createContext(null);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        withCredentials: true
      });
      setUser(response.data);
    } catch (error) {
      console.log("Not authenticated");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, {
        withCredentials: true
      });
      setUser(null);
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout, API }}>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
            <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" />} />
            <Route path="/drug-tests" element={user ? <DrugTests /> : <Navigate to="/" />} />
            <Route path="/meetings" element={user ? <Meetings /> : <Navigate to="/" />} />
            <Route path="/rent-payments" element={user ? <RentPayments /> : <Navigate to="/" />} />
            <Route path="/devotions" element={user ? <Devotions /> : <Navigate to="/" />} />
            <Route path="/reading-materials" element={user ? <ReadingMaterials /> : <Navigate to="/" />} />
            <Route path="/messages" element={user ? <Messages /> : <Navigate to="/" />} />
            <Route path="/calendar" element={user ? <Calendar /> : <Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </div>
    </AuthContext.Provider>
  );
}

export default App;

import React from "react";