import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DealershipForm = ({ onSuccess, dealership }) => {
    const [form, setForm] = useState(dealership || {
        name: '',
        address: ''
    });

    useEffect(() => {
        if (dealership) setForm(dealership);
    }, [dealership]);

    const handleChange = (e) => {
        setForm(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const method = dealership ? 'put' : 'post';
        const url = dealership
            ? `http://localhost:5000/api/dealerships/${dealership.id}`
            : `http://localhost:5000/api/dealerships`;

        axios[method](url, form)
            .then(() => {
                alert(dealership ? 'Обновлено!' : 'Добавлено!');
                onSuccess();
            })
            .catch(err => alert('Ошибка при сохранении'));
    };

    return (
        <form onSubmit={handleSubmit}>
            <h3>{dealership ? "✏️ Редактировать" : "➕ Добавить"} автосалон</h3>

            <label>Название автосалона</label>
            <input type="text" name="name" placeholder="Например, АвтоПлюс" value={form.name} onChange={handleChange} required />

            <label>Адрес (город, улица, дом)</label>
            <input type="text" name="address" placeholder="Москва, ул. Ленина, 10" value={form.address} onChange={handleChange} required />

            <button type="submit">{dealership ? "Сохранить" : "Добавить"}</button>
        </form>
    );
};

export default DealershipForm;
