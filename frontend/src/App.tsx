import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login/Login";
import GuestRoute from "./components/GuestRoute";
import ProtectedLayout from "./components/ProtectedLayout/ProtectedLayout.tsx";

import Main from "./pages/Main/Main.tsx";
import Traffic from "./pages/Traffic/Traffic.tsx";

function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedLayout />
        }
      >
        <Route
          index
          element={<Main />}
        />

        <Route
          path="traffic"
          element={
            <ProtectedRoute allowedRoles={["buyer", "admin", "owner"]}>
              <Traffic />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
