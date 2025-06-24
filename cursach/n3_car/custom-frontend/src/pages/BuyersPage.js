import React, { useEffect, useState } from 'react';
import axios from 'axios';
import BuyerForm from '../components/BuyerForm';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const BuyersPage = () => {
    const [buyers, setBuyers] = useState([]);
    const [selectedBuyer, setSelectedBuyer] = useState(null);
    const [modalBuyer, setModalBuyer] = useState(null);
    const [matchingCars, setMatchingCars] = useState([]);

    const loadBuyers = () => {
        axios.get('http://localhost:5000/api/buyers')
            .then(res => setBuyers(res.data))
            .catch(console.error);
    };

    useEffect(() => {
        loadBuyers();
    }, []);

    const selectBuyer = (buyer) => {
        setSelectedBuyer(buyer);
        axios.get(`http://localhost:5000/api/match/cars-for-buyer/${buyer.id}`)
            .then(res => setMatchingCars(res.data))
            .catch(console.error);
    };

    const handleDelete = (id) => {
        if (window.confirm("Удалить покупателя?")) {
            axios.delete(`http://localhost:5000/api/buyers/${id}`)
                .then(() => loadBuyers())
                .catch(err => alert("Ошибка удаления"));
        }
    };

    return (
        <div className="container">
            <div className="page-header">
                <h2>🧑 Покупатели</h2>
                <button onClick={() => setModalBuyer({})}><FontAwesomeIcon icon="plus"/> Добавить</button>
            </div>


            {!selectedBuyer && (
                <>
                    {buyers.map(buyer => (
                        <div key={buyer.id} className="buyer-card">
                            <strong>{buyer.fullName}</strong>
                            <p>
                                Марка: {buyer.preferredFirm || 'не важно'} /
                                Модель: {buyer.preferredModel || 'не важно'} /
                                Год: {buyer.preferredYear || 'не важно'}
                            </p>
                            <p>
                                Состояние: {buyer.preferredCondition || 'не важно'} /
                                Цена до: {buyer.maxPrice ? `$${buyer.maxPrice}` : 'не важно'}
                            </p>
                            <div>
                            <button onClick={() => selectBuyer(buyer)}><FontAwesomeIcon icon="search" /> Подробнее</button>
                                <button onClick={() => setModalBuyer(buyer)}><FontAwesomeIcon icon="edit" /> Редактировать</button>
                                <button className="delete" onClick={() => handleDelete(buyer.id)}><FontAwesomeIcon icon="trash" /> Удалить</button>
                            </div>
                        </div>
                    ))}

                    {modalBuyer !== null && (
                        <div className="modal-overlay" onClick={() => setModalBuyer(null)}>
                            <div className="modal-content" onClick={e => e.stopPropagation()}>
                                <BuyerForm
                                    buyer={modalBuyer.id ? modalBuyer : null}
                                    onSuccess={() => { loadBuyers(); setModalBuyer(null); }}
                                />
                                <button className="delete" onClick={() => setModalBuyer(null)}>Закрыть</button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {selectedBuyer && (
                <div className="buyer-card">
                    <h3>{selectedBuyer.fullName}</h3>
                    <p>Контакт: {selectedBuyer.coordinates}</p>
                    <p>Фирма: {selectedBuyer.preferredFirm || 'не важно'} / Модель: {selectedBuyer.preferredModel || 'не важно'}</p>
                    <p>Год: {selectedBuyer.preferredYear || 'не важно'} / Состояние: {selectedBuyer.preferredCondition || 'не важно'}</p>
                    <p>Бюджет: ${selectedBuyer.maxPrice}</p>
                    <h4>Подходящие автомобили:</h4>
                    {matchingCars.length === 0 ? <p>❌ Нет подходящих</p> : (
                        <ul>{matchingCars.map(c => (
                            <li key={c.id}>{c.firm} {c.model} — ${c.price}</li>
                        ))}</ul>
                    )}
                    <button onClick={() => setSelectedBuyer(null)}><FontAwesomeIcon icon="arrow-left" /> Назад</button>
                </div>
            )}
        </div>
    );
};

export default BuyersPage;
