import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BuyerForm = ({ onSuccess, buyer }) => {
    const [form, setForm] = useState(buyer || {
        fullName: '',
        contactInfo: '',
        preferredFirm: '',
        preferredModel: '',
        preferredYear: '',
        preferredCondition: '',
        maxPrice: ''
    });

    useEffect(() => {
        if (buyer) setForm(buyer);
    }, [buyer]);

    const handleChange = (e) => {
        setForm(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const method = buyer ? 'put' : 'post';
        const url = buyer
            ? `http://localhost:5000/api/buyers/${buyer.id}`
            : `http://localhost:5000/api/buyers`;

        // Приведение пустых значений к null
        const cleanForm = {
            ...form,
            preferredFirm: form.preferredFirm || null,
            preferredModel: form.preferredModel || null,
            preferredYear: form.preferredYear || null,
            preferredCondition: form.preferredCondition || null
        };

        axios[method](url, cleanForm)
            .then(() => {
                alert(buyer ? 'Обновлено!' : 'Добавлено!');
                onSuccess();
            })
            .catch(err => alert('Ошибка при сохранении'));
    };

    return (
        <form onSubmit={handleSubmit}>
            <h3>{buyer ? "✏️ Редактировать" : "➕ Добавить"} покупателя</h3>

            <label>ФИО покупателя</label>
            <input type="text" name="fullName" placeholder="Иван Иванов" value={form.fullName} onChange={handleChange} required />

            <label>Контактные данные (телефон или email)</label>
            <input type="text" name="contactInfo" placeholder="+7 999 123 45 67 / email@example.com" value={form.contactInfo} onChange={handleChange} required />

            <label>Предпочтительная марка автомобиля</label>
            <input type="text" name="preferredFirm" placeholder="Например, Toyota" value={form.preferredFirm} onChange={handleChange} />

            <label>Предпочтительная модель</label>
            <input type="text" name="preferredModel" placeholder="Например, Corolla" value={form.preferredModel} onChange={handleChange} />

            <label>Минимальный год выпуска</label>
            <input type="number" name="preferredYear" placeholder="Например, 2018" value={form.preferredYear} onChange={handleChange} />

            <label>Состояние автомобиля</label>
            <select name="preferredCondition" value={form.preferredCondition} onChange={handleChange}>
                <option value="">Любое состояние</option>
                <option value="новая">Новая</option>
                <option value="с пробегом">С пробегом</option>
            </select>

            <label>Максимальная цена ($)</label>
            <input type="number" name="maxPrice" placeholder="например 15000" value={form.maxPrice} onChange={handleChange} />

            <button type="submit">{buyer ? "Сохранить" : "Добавить"}</button>
        </form>
    );
};

export default BuyerForm;
