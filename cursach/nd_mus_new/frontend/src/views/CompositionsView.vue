<template>
  <div class="container">
    <h1>🎼 Музыкальные произведения</h1>

    <input
        v-model="searchQuery"
        type="text"
        placeholder="Поиск по названию..."
        class="search-input"
    />

    <button class="add-btn" @click="openAdd">➕ Добавить произведение</button>

    <div class="list">
      <div class="card" v-for="comp in filteredCompositions" :key="comp.id">
        <div class="main">
          <div class="comp-title">{{ comp.title }}</div>
          <div class="comp-meta">
            Автор: {{ getComposerName(comp.composerId) }}
          </div>
        </div>
        <div class="actions">
          <button @click="edit(comp)" title="Редактировать">✏️</button>
          <button @click="remove(comp.id)" title="Удалить" class="danger">🗑</button>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h2>{{ isEditing ? 'Редактировать произведение' : 'Новое произведение' }}</h2>
        <form @submit.prevent="saveComposition" class="form">
          <div class="form-line">
            <label for="title">Название:</label>
            <input v-model="composition.title" placeholder="Название произведения" required />
          </div>

          <div class="form-line">
            <label for="composer">Композитор:</label>
            <select v-model="composition.composerId" required>
              <option disabled value="">Выбери композитора</option>
              <option v-for="m in musicians" :key="m.id" :value="m.id">
                {{ m.fullName }}
              </option>
            </select>
          </div>

          <div class="form-line">
            <label for="genre">Жанр:</label>
            <input v-model="composition.genre" placeholder="Жанр (опц.)" />
          </div>

          <div class="form-line">
            <label for="year">Год:</label>
            <input v-model="composition.year" placeholder="Год (опц.)" type="number" />
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
      compositions: [],
      musicians: [],
      composition: {
        title: '',
        composerId: ''
      },
      showModal: false,
      isEditing: false,
      editId: null,
      searchQuery: ''
    };
  },
  computed: {
    filteredCompositions() {
      return this.compositions.filter(c =>
          c.title.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }
  },
  methods: {
    getComposerName(id) {
      const composer = this.musicians.find(m => m.id === id);
      return composer ? composer.fullName : '—';
    },
    async loadData() {
      const [compsRes, musRes] = await Promise.all([
        axios.get('http://localhost:3000/api/compositions'),
        axios.get('http://localhost:3000/api/musicians')
      ]);
      this.compositions = compsRes.data;
      this.musicians = musRes.data;
    },
    openAdd() {
      this.composition = { title: '', composerId: '' };
      this.isEditing = false;
      this.showModal = true;
    },
    edit(c) {
      this.composition = { ...c };
      this.editId = c.id;
      this.isEditing = true;
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
      this.isEditing = false;
      this.editId = null;
    },
    async saveComposition() {
      if (this.isEditing) {
        const res = await axios.put(
            `http://localhost:3000/api/compositions/${this.editId}`,
            this.composition
        );
        const idx = this.compositions.findIndex(c => c.id === this.editId);
        this.compositions[idx] = res.data;
      } else {
        const res = await axios.post(
            'http://localhost:3000/api/compositions',
            this.composition
        );
        this.compositions.push(res.data);
      }
      this.closeModal();
    },
    async remove(id) {
      await axios.delete(`http://localhost:3000/api/compositions/${id}`);
      this.compositions = this.compositions.filter(c => c.id !== id);
    }
  },
  mounted() {
    this.loadData();
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
