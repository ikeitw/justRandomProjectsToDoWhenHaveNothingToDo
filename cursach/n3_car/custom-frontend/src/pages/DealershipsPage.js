import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DealershipForm from '../components/DealershipForm';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const DealershipsPage = () => {
    const [dealerships, setDealerships] = useState([]);
    const [selectedDealership, setSelectedDealership] = useState(null);
    const [modalDealer, setModalDealer] = useState(null);
    const [cars, setCars] = useState([]);

    const loadDealerships = () => {
        axios.get('http://localhost:5000/api/dealerships')
            .then(res => setDealerships(res.data))
            .catch(console.error);
    };

    useEffect(() => {
        loadDealerships();
    }, []);

    const selectDealership = (dealer) => {
        setSelectedDealership(dealer);
        axios.get(`http://localhost:5000/api/cars?dealershipId=${dealer.id}`)
            .then(res => setCars(res.data))
            .catch(console.error);
    };

    const handleDelete = (id) => {
        if (window.confirm("Удалить салон?cd")) {
            axios.delete(`http://localhost:5000/api/dealerships/${id}`)
                .then(() => loadDealerships())
                .catch(err => alert("Ошибка удаления"));
        }
    };

    return (
        <div className="container">
            <div className="page-header">
                <h2>🏢 Автосалоны</h2>
                <button onClick={() => setModalDealer({})}><FontAwesomeIcon icon="plus"/> Добавить</button>
            </div>


            {!selectedDealership && (
                <>
                    {dealerships.map(dealer => (
                        <div key={dealer.id} className="dealer-card">
                            <strong>{dealer.name}</strong>
                            <div>
                                <button onClick={() => selectDealership(dealer)}><FontAwesomeIcon icon="search" /> Подробнее</button>
                                <button onClick={() => setModalDealer(dealer)}><FontAwesomeIcon icon="edit" /> Редактировать</button>
                                <button className="delete" onClick={() => handleDelete(dealer.id)}><FontAwesomeIcon icon="trash" /> Удалить</button>
                            </div>
                        </div>
                    ))}

                    {modalDealer !== null && (
                        <div className="modal-overlay" onClick={() => setModalDealer(null)}>
                            <div className="modal-content" onClick={e => e.stopPropagation()}>
                                <DealershipForm
                                    dealership={modalDealer.id ? modalDealer : null}
                                    onSuccess={() => { loadDealerships(); setModalDealer(null); }}
                                />
                                <button className="delete" onClick={() => setModalDealer(null)}>Закрыть</button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {selectedDealership && (
                <div className="dealer-card">
                    <h3>{selectedDealership.name}</h3>
                    <h4>Автомобили в наличии:</h4>
                    {cars.length === 0 ? <p>❌ Нет автомобилей</p> : (
                        <ul>{cars.map(car => (
                            <li key={car.id}>{car.firm} {car.model} ({car.year}) — ${car.price}</li>
                        ))}</ul>
                    )}
                    <button onClick={() => setSelectedDealership(null)}><FontAwesomeIcon icon="arrow-left" /> Назад</button>
                </div>
            )}
        </div>
    );
};

export default DealershipsPage;
