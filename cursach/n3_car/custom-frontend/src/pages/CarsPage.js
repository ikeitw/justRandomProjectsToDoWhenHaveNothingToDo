import React, { useEffect, useState } from 'react';
import axios from 'axios';
import CarForm from '../components/CarForm';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const CarsPage = () => {
    const [cars, setCars] = useState([]);
    const [selectedCar, setSelectedCar] = useState(null);
    const [modalCar, setModalCar] = useState(null);
    const [matchingBuyers, setMatchingBuyers] = useState([]);

    const [brandTerm, setBrandTerm] = useState('');
    const [modelTerm, setModelTerm] = useState('');
    const [yearTerm, setYearTerm] = useState('');
    const [mileageFrom, setMileageFrom] = useState('');
    const [mileageTo, setMileageTo] = useState('');
    const [sortKey, setSortKey] = useState('default');

    useEffect(() => {
        axios.get('http://localhost:5000/api/cars')
            .then(res => setCars(res.data))
            .catch(console.error);
    }, []);

    const selectCar = (car) => {
        setSelectedCar(car);
        axios.get(`http://localhost:5000/api/match/buyers-for-car/${car.id}`)
            .then(res => setMatchingBuyers(res.data))
            .catch(console.error);
    };

    const handleDelete = (id) => {
        if (window.confirm("Удалить автомобиль?")) {
            axios.delete(`http://localhost:5000/api/cars/${id}`)
                .then(() => setCars(c => c.filter(x => x.id !== id)))
                .catch(() => alert("Ошибка удаления"));
        }
    };

    const clearFilters = () => {
        setBrandTerm('');
        setModelTerm('');
        setYearTerm('');
        setMileageFrom('');
        setMileageTo('');
        setSortKey('default');
    };

    const filteredAndSorted = cars
        .filter(car => {
            const brandMatch = car.firm.toLowerCase().includes(brandTerm.toLowerCase());
            const modelMatch = car.model.toLowerCase().includes(modelTerm.toLowerCase());
            const yearMatch = !yearTerm || car.year === Number(yearTerm);
            const mileageMatch =
                (!mileageFrom || car.mileage >= Number(mileageFrom)) &&
                (!mileageTo || car.mileage <= Number(mileageTo));
            return brandMatch && modelMatch && yearMatch && mileageMatch;
        })
        .sort((a, b) => {
            if (sortKey === 'price-asc') return a.price - b.price;
            if (sortKey === 'price-desc') return b.price - a.price;
            if (sortKey === 'year-asc') return a.year - b.year;
            if (sortKey === 'year-desc') return b.year - a.year;
            return 0;
        });

    return (
        <div className="container">
            <div className="page-header">
                <h2>🚗 Список автомобилей</h2>
                <button onClick={() => setModalCar({})}>
                    <FontAwesomeIcon icon="plus" /> Добавить
                </button>
            </div>

            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Марка"
                    value={brandTerm}
                    onChange={(e) => setBrandTerm(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Модель"
                    value={modelTerm}
                    onChange={(e) => setModelTerm(e.target.value)}
                />
                <input
                    type="number"
                    placeholder="Год"
                    value={yearTerm}
                    onChange={(e) => setYearTerm(e.target.value)}
                />
                <input
                    type="number"
                    placeholder="Пробег от"
                    value={mileageFrom}
                    onChange={(e) => setMileageFrom(e.target.value)}
                />
                <input
                    type="number"
                    placeholder="Пробег до"
                    value={mileageTo}
                    onChange={(e) => setMileageTo(e.target.value)}
                />
                <button onClick={clearFilters}>Очистить</button>
            </div>

            <div className="filters">
                <select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
                    <option value="default">Без сортировки</option>
                    <option value="price-asc">Цена ↑</option>
                    <option value="price-desc">Цена ↓</option>
                    <option value="year-asc">Год ↑</option>
                    <option value="year-desc">Год ↓</option>
                </select>
            </div>

            {!selectedCar && (
                <>
                    {filteredAndSorted.map(car => (
                        <div key={car.id} className="car-card">
                            <strong>{car.firm} {car.model}</strong> — {car.year}
                            <p>Состояние: {car.condition}, Пробег: {car.mileage} км</p>
                            <p><b>Цена: ${car.price}</b></p>
                            <div>
                                <button onClick={() => selectCar(car)}>
                                    <FontAwesomeIcon icon="search" /> Подробнее
                                </button>
                                <button onClick={() => setModalCar(car)}>
                                    <FontAwesomeIcon icon="edit" /> Редактировать
                                </button>
                                <button className="delete" onClick={() => handleDelete(car.id)}>
                                    <FontAwesomeIcon icon="trash" /> Удалить
                                </button>
                            </div>
                        </div>
                    ))}

                    {modalCar !== null && (
                        <div className="modal-overlay" onClick={() => setModalCar(null)}>
                            <div className="modal-content" onClick={e => e.stopPropagation()}>
                                <CarForm
                                    car={modalCar.id ? modalCar : null}
                                    onSuccess={() => {
                                        setModalCar(null);
                                        axios.get('http://localhost:5000/api/cars').then(res => setCars(res.data));
                                    }}
                                />
                                <button className="delete" onClick={() => setModalCar(null)}>Закрыть</button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {selectedCar && (
                <div className="car-card">
                    <h3>{selectedCar.firm} {selectedCar.model} ({selectedCar.year})</h3>
                    <p>Состояние: {selectedCar.condition}, Мощность: {selectedCar.enginePower} л.с.</p>
                    <p>Пробег: {selectedCar.mileage} км</p>
                    <p><b>Цена: ${selectedCar.price}</b></p>
                    <p><strong>Салон:</strong> {selectedCar.Dealership?.name || '—'}</p>
                    <h4>Покупатели:</h4>
                    {matchingBuyers.length === 0 ? <p>❌ Нет подходящих</p> : (
                        <ul>
                            {matchingBuyers.map(b => (
                                <li key={b.id}>{b.fullName} — до ${b.maxPrice}</li>
                            ))}
                        </ul>
                    )}
                    <button onClick={() => setSelectedCar(null)}>
                        <FontAwesomeIcon icon="arrow-left"/> Назад
                    </button>
                </div>
            )}
        </div>
    );
};

export default CarsPage;
