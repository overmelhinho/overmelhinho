import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LeadForm from './components/LeadForm';
import Home from './components/Home';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lead-form" element={<LeadForm />} />
      </Routes>
    </Router>
  );
}

export default App;
