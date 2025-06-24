import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CarsPage from './pages/CarsPage';
import BuyersPage from './pages/BuyersPage';
import DealershipsPage from './pages/DealershipsPage';
import './App.css';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faPlus, faEdit, faTrash, faArrowLeft, faSort, faSearch } from '@fortawesome/free-solid-svg-icons';

library.add(faPlus, faEdit, faTrash, faArrowLeft, faSort, faSearch);

function App() {
    return (
        <Router>
            <div className="app-container">
                <header>
                    <h1>Автосалон</h1>
                    <nav>
                        <Link to="/">Автомобили</Link>
                        <Link to="/buyers">Покупатели</Link>
                        <Link to="/dealerships">Салоны</Link>
                    </nav>
                </header>

                <main>
                    <Routes>
                        <Route path="/" element={<CarsPage />} />
                        <Route path="/buyers" element={<BuyersPage />} />
                        <Route path="/dealerships" element={<DealershipsPage />} />
                    </Routes>
                </main>

                <footer>
                    <p>&copy; 2025 Автосалон. Все права защищены.</p>
                </footer>
            </div>
        </Router>
    );
}

export default App;
