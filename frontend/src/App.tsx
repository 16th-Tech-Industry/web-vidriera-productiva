import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Login } from './components/Login';
import { Mapa } from './components/mapa/mapa';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/mapa" element={<Mapa />} />
      </Routes>
    </Router>
  );
}

export default App;