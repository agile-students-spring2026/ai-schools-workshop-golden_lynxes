import { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import SearchPage from './pages/SearchPage';
import DistrictDetailPage from './pages/DistrictDetailPage';
import ComparePage from './pages/ComparePage';
import './index.css';

function Header({ compareCount }) {
  return (
    <header className="app-header">
      <h1>🏫 District Finder</h1>
      <nav>
        <NavLink to="/" end>Search</NavLink>
        <NavLink to="/compare">
          Compare {compareCount > 0 && `(${compareCount})`}
        </NavLink>
      </nav>
    </header>
  );
}

function App() {
  const [compareList, setCompareList] = useState([]); // [{id, name, ...}]

  function handleAddCompare(district) {
    setCompareList((prev) => {
      const exists = prev.find((d) => d.id === district.id);
      if (exists) return prev.filter((d) => d.id !== district.id);
      if (prev.length >= 5) return prev;
      return [...prev, district];
    });
  }

  function handleRemoveCompare(id) {
    setCompareList((prev) => prev.filter((d) => d.id !== id));
  }

  const compareIds = compareList.map((d) => d.id);

  return (
    <BrowserRouter>
      <Header compareCount={compareList.length} />
      <Routes>
        <Route
          path="/"
          element={
            <SearchPage
              compareIds={compareIds}
              onAddCompare={handleAddCompare}
            />
          }
        />
        <Route
          path="/district/:id"
          element={
            <DistrictDetailPage
              compareIds={compareIds}
              onAddCompare={handleAddCompare}
            />
          }
        />
        <Route
          path="/compare"
          element={
            <ComparePage
              compareIds={compareIds}
              compareDistricts={compareList}
              onRemoveCompare={handleRemoveCompare}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
