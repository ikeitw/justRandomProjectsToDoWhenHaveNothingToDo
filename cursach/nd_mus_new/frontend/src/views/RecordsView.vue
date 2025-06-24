<template>
  <div class="container">
    <h1>💿 Пластинки</h1>

    <input
        v-model="searchQuery"
        type="text"
        placeholder="Поиск по лейблу..."
        class="search-input"
    />

    <button class="add-btn" @click="openAdd">➕ Добавить пластинку</button>

    <div class="list">
      <div
          class="card"
          v-for="r in filteredRecords"
          :key="r.id"
          @click="showDetails(r)"
      >
        <div class="main">
          <div class="rec-label">{{ r.label }}</div>
          <div class="rec-meta">{{ r.mediaType }} | {{ r.releaseDate }}</div>
        </div>
        <div class="actions" @click.stop>
          <button @click="edit(r)" title="Редактировать">✏️</button>
          <button @click="remove(r.id)" title="Удалить" class="danger">🗑</button>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h2>{{ isEditing ? 'Редактировать пластинку' : 'Новая пластинка' }}</h2>
        <form @submit.prevent="saveRecord" class="form">
          <div class="form-line">
            <label for="label">Лейбл:</label>
            <select v-model="record.label" required>
              <option disabled value="">Выбери лейбл</option>
              <option v-for="label in labelOptions" :key="label" :value="label">{{ label }}</option>
              <option value="__manual">➕ Ввести вручную</option>
            </select>
          </div>

          <div v-if="record.label === '__manual'" class="form-line">
            <label for="manualLabel">Новый лейбл:</label>
            <input v-model="manualLabel" placeholder="Введи новый лейбл" required />
          </div>

          <div class="form-line">
            <label for="releaseDate">Дата выпуска:</label>
            <input v-model="record.releaseDate" type="date" required />
          </div>

          <div class="form-line">
            <label for="mediaType">Тип:</label>
            <input v-model="record.mediaType" placeholder="Тип (cd, vinyl, ...)" />
          </div>

          <div class="form-line">
            <label for="wholesalePrice">Опт. цена:</label>
            <input v-model.number="record.wholesalePrice" type="number" />
          </div>

          <div class="form-line">
            <label for="retailPrice">Розн. цена:</label>
            <input v-model.number="record.retailPrice" type="number" />
          </div>

          <div class="form-line">
            <label for="stock">Остаток:</label>
            <input v-model.number="record.stock" type="number" />
          </div>

          <div class="form-buttons">
            <button type="submit">{{ isEditing ? 'Обновить' : 'Добавить' }}</button>
            <button type="button" @click="closeModal" class="cancel">Отмена</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showDetailsModal" class="modal-overlay" @click.self="closeDetails">
      <div class="modal">
        <h2>📄 Детали пластинки</h2>
        <p><strong>Лейбл:</strong> {{ selected.label }}</p>
        <p><strong>Тип:</strong> {{ selected.mediaType }}</p>
        <p><strong>Дата выпуска:</strong> {{ selected.releaseDate }}</p>
        <p><strong>Цена:</strong> {{ selected.wholesalePrice }} ₽ (опт), {{ selected.retailPrice }} ₽ (розница)</p>
        <p><strong>Продано за год:</strong> {{ selected.soldThisYear ?? '—' }}</p>
        <p><strong>Осталось на складе:</strong> {{ selected.stock }}</p>
        <button @click="closeDetails" class="cancel" style="margin-top: 1rem">Закрыть</button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      records: [],
      record: {
        label: '',
        mediaType: '',
        releaseDate: '',
        wholesalePrice: 0,
        retailPrice: 0,
        stock: 0
      },
      isEditing: false,
      editId: null,
      showModal: false,
      showDetailsModal: false,
      selected: {},
      searchQuery: '',
      labelOptions: [],
      manualLabel: ''
    };
  },
  computed: {
    filteredRecords() {
      return this.records.filter(r =>
          r.label?.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }
  },
  async mounted() {
    const res = await axios.get('http://localhost:3000/api/records');
    this.records = res.data;
    this.labelOptions = [...new Set(this.records.map(r => r.label))];
  },
  methods: {
    openAdd() {
      this.record = {
        label: '',
        mediaType: '',
        releaseDate: '',
        wholesalePrice: 0,
        retailPrice: 0,
        stock: 0
      };
      this.manualLabel = '';
      this.isEditing = false;
      this.showModal = true;
    },
    edit(r) {
      this.record = { ...r };
      this.manualLabel = '';
      this.editId = r.id;
      this.isEditing = true;
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
      this.editId = null;
      this.isEditing = false;
    },
    async saveRecord() {
      const labelValue = this.record.label === '__manual' ? this.manualLabel : this.record.label;

      const payload = {
        ...this.record,
        label: labelValue
      };

      if (this.isEditing) {
        const res = await axios.put(`http://localhost:3000/api/records/${this.editId}`, payload);
        const idx = this.records.findIndex(r => r.id === this.editId);
        this.records[idx] = res.data;
      } else {
        const res = await axios.post('http://localhost:3000/api/records', payload);
        this.records.push(res.data);
        if (!this.labelOptions.includes(labelValue)) {
          this.labelOptions.push(labelValue);
        }
      }

      this.closeModal();
    },
    async remove(id) {
      await axios.delete(`http://localhost:3000/api/records/${id}`);
      this.records = this.records.filter(r => r.id !== id);
    },
    showDetails(r) {
      this.selected = r;
      this.showDetailsModal = true;
    },
    closeDetails() {
      this.selected = {};
      this.showDetailsModal = false;
    }
  }
};
</script>

<style scoped>
@import './_sharedDark.css';

.search-input {
  width: 100%;
  max-width: 400px;
  margin: 0 auto 1rem auto;
  display: block;
  padding: 10px 14px;
  background-color: #2c2c35;
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 1rem;
}
.form-line {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
}

.form-line label {
  min-width: 110px;
  font-weight: 500;
  color: #ddd;
}

</style>
