import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CarForm = ({ onSuccess, car }) => {
    const [form, setForm] = useState(car || {
        firm: '',
        model: '',
        year: 2023,
        enginePower: 100,
        transmission: 'АКП',
        condition: 'новая',
        mileage: 0,
        features: '',
        price: 0,
        DealershipId: ''
    });

    const [dealers, setDealers] = useState([]);

    useEffect(() => {
        axios.get('http://localhost:5000/api/dealerships')
            .then(res => setDealers(res.data))
            .catch(console.error);
    }, []);

    const handleChange = (e) => {
        setForm(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const method = car ? 'put' : 'post';
        const url = car
            ? `http://localhost:5000/api/cars/${car.id}`
            : `http://localhost:5000/api/cars`;

        axios[method](url, form)
            .then(() => {
                alert(car ? 'Обновлено!' : 'Добавлено!');
                onSuccess();
            })
            .catch(err => alert('Ошибка'));
    };

    return (
        <form onSubmit={handleSubmit}>
            <h3>{car ? "✏️ Редактировать" : "➕ Добавить"} автомобиль</h3>

            <label>Фирма</label>
            <input type="text" name="firm" placeholder="Например, BMW" value={form.firm} onChange={handleChange} required />

            <label>Модель</label>
            <input type="text" name="model" placeholder="Например, X5" value={form.model} onChange={handleChange} required />

            <label>Год выпуска</label>
            <input type="number" name="year" placeholder="2023" value={form.year} onChange={handleChange} required />

            <label>Мощность двигателя (л.с.)</label>
            <input type="number" name="enginePower" placeholder="например 150" value={form.enginePower} onChange={handleChange} />

            <label>Коробка передач</label>
            <select name="transmission" value={form.transmission} onChange={handleChange}>
                <option value="АКП">АКП (автомат)</option>
                <option value="МКП">МКП (механика)</option>
            </select>

            <label>Состояние</label>
            <select name="condition" value={form.condition} onChange={handleChange}>
                <option value="новая">Новая</option>
                <option value="с пробегом">С пробегом</option>
            </select>

            <label>Пробег (в км)</label>
            <input type="number" name="mileage" placeholder="например 50000" value={form.mileage} onChange={handleChange} />

            <label>Особенности (цвет, комплектация и т.п.)</label>
            <input type="text" name="features" placeholder="Например: белый, кожаный салон" value={form.features} onChange={handleChange} />

            <label>Цена ($)</label>
            <input type="number" name="price" placeholder="например 20000" value={form.price} onChange={handleChange} />

            <label>Автосалон</label>
            <select name="DealershipId" value={form.DealershipId} onChange={handleChange} required>
                <option value="">Выберите салон</option>
                {dealers.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                ))}
            </select>

            <button type="submit">{car ? "Сохранить изменения" : "Добавить"}</button>
        </form>
    );
};

export default CarForm;
