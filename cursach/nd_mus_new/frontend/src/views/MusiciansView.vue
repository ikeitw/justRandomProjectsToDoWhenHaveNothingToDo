<template>
  <div class="container">
    <h1>🎤 Музыканты</h1>

    <input
        v-model="searchQuery"
        type="text"
        placeholder="Поиск по имени..."
        class="search-input"
    />

    <button class="add-btn" @click="openAdd">➕ Добавить музыканта</button>

    <div class="list">
      <div class="card" v-for="m in filteredMusicians" :key="m.id">
        <div class="main">
          <div class="mus-name">{{ m.fullName }}</div>
          <div class="mus-meta">
            Роль: {{ m.role }} |
            Инструменты:
            <span v-if="m.instruments && m.instruments.length > 0">
              {{ Array.isArray(m.instruments) ? m.instruments.join(', ') : m.instruments }}
            </span>
            <span v-else>—</span>
          </div>
        </div>
        <div class="actions">
          <button @click="edit(m)" title="Редактировать">✏️</button>
          <button @click="remove(m.id)" title="Удалить" class="danger">🗑</button>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h2>{{ isEditing ? 'Редактировать музыканта' : 'Новый музыкант' }}</h2>
        <form @submit.prevent="saveMusician" class="form">
          <div class="form-line">
            <label for="fullName">ФИО:</label>
            <input v-model="musician.fullName" placeholder="Фамилия Имя Отчество" required />
          </div>

          <div class="form-line">
            <label for="role">Роль:</label>
            <input v-model="musician.role" placeholder="composer, performer, ..." required />
          </div>

          <div class="form-line">
            <label for="instruments">Инструменты:</label>
            <input v-model="instruments" placeholder="Гитара, фортепиано, ..." />
          </div>

          <div class="form-buttons">
            <button type="submit">{{ isEditing ? 'Обновить' : 'Добавить' }}</button>
            <button type="button" @click="closeModal" class="cancel">Отмена</button>
          </div>
        </form>

      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      musicians: [],
      musician: {fullName: '', role: '', instruments: null},
      instruments: '',
      isEditing: false,
      editId: null,
      showModal: false,
      searchQuery: ''
    };
  },
  computed: {
    filteredMusicians() {
      return this.musicians.filter(m =>
          m.fullName.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }
  },
  async mounted() {
    const res = await axios.get('http://localhost:3000/api/musicians');
    this.musicians = res.data;
  },
  methods: {
    openAdd() {
      this.musician = {fullName: '', role: '', instruments: null};
      this.instruments = '';
      this.isEditing = false;
      this.showModal = true;
    },
    edit(m) {
      this.musician = {...m};
      this.instruments = Array.isArray(m.instruments)
          ? m.instruments.join(', ')
          : (m.instruments || '');
      this.editId = m.id;
      this.isEditing = true;
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
      this.isEditing = false;
      this.editId = null;
    },
    async saveMusician() {
      const trimmed = this.instruments.trim();
      const finalInstruments =
          trimmed === ''
              ? null
              : trimmed.split(',').map(i => i.trim());

      const payload = {
        ...this.musician,
        instruments: finalInstruments
      };

      if (this.isEditing) {
        const res = await axios.put(`http://localhost:3000/api/musicians/${this.editId}`, payload);
        const idx = this.musicians.findIndex(m => m.id === this.editId);
        this.musicians[idx] = res.data;
      } else {
        const res = await axios.post('http://localhost:3000/api/musicians', payload);
        this.musicians.push(res.data);
      }
      this.closeModal();
    },
    async remove(id) {
      await axios.delete(`http://localhost:3000/api/musicians/${id}`);
      this.musicians = this.musicians.filter(m => m.id !== id);
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
