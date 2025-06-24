<template>
  <div class="container">
    <h1>🎻 Ансамбли</h1>

    <input
        v-model="searchQuery"
        type="text"
        placeholder="Поиск по названию ансамбля..."
        class="search-input"
    />

    <button class="add-btn" @click="openAdd">➕ Добавить ансамбль</button>

    <div class="list">
      <div
          class="card"
          v-for="ens in filteredEnsembles"
          :key="ens.id"
          @click="showDetails(ens)"
      >
        <div class="main">
          <div class="ens-name">{{ ens.name }}</div>
          <div class="ens-type">{{ ens.type }}</div>
        </div>
        <div class="actions" @click.stop>
          <button @click="edit(ens)" title="Редактировать">✏️</button>
          <button @click="remove(ens.id)" title="Удалить" class="danger">🗑</button>
        </div>
      </div>
    </div>

    <!-- Модалка добавления/редактирования -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h2>{{ isEditing ? 'Редактировать ансамбль' : 'Новый ансамбль' }}</h2>
        <form @submit.prevent="saveEnsemble" class="form">
          <div class="form-line">
            <label for="name">Название:</label>
            <input v-model="ensemble.name" placeholder="Название ансамбля" required />
          </div>

          <div class="form-line">
            <label for="type">Тип:</label>
            <input v-model="ensemble.type" placeholder="Оркестр, квартет, ансамбль..." required />
          </div>

          <div class="form-buttons">
            <button type="submit">{{ isEditing ? 'Обновить' : 'Добавить' }}</button>
            <button type="button" @click="closeModal" class="cancel">Отмена</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Модалка деталей ансамбля -->
    <div v-if="showDetailsModal" class="modal-overlay" @click.self="closeDetails">
      <div class="modal">
        <h2>📄 {{ selected.name }} ({{ selected.type }})</h2>
        <p><strong>Количество произведений:</strong> {{ selected.details?.compositionCount ?? '—' }}</p>
        <p><strong>Диски ансамбля:</strong></p>
        <ul>
          <li v-for="cd in selected.details?.cds ?? []" :key="cd">{{ cd }}</li>
        </ul>
        <p><strong>🔥 Лидеры продаж текущего года:</strong></p>
        <ul>
          <li v-for="hit in selected.details?.bestSellers ?? []" :key="hit">{{ hit }}</li>
        </ul>
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
      ensembles: [],
      ensemble: { name: '', type: '' },
      isEditing: false,
      editId: null,
      showModal: false,
      showDetailsModal: false,
      selected: {},
      searchQuery: ''
    };
  },
  computed: {
    filteredEnsembles() {
      return this.ensembles.filter(e =>
          e.name.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }
  },
  async mounted() {
    const res = await axios.get('http://localhost:3000/api/ensembles');
    this.ensembles = res.data;
  },
  methods: {
    openAdd() {
      this.ensemble = {name: '', type: ''};
      this.isEditing = false;
      this.showModal = true;
    },
    edit(ens) {
      this.ensemble = {...ens};
      this.editId = ens.id;
      this.isEditing = true;
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
      this.editId = null;
      this.isEditing = false;
    },
    async saveEnsemble() {
      if (this.isEditing) {
        const res = await axios.put(`http://localhost:3000/api/ensembles/${this.editId}`, this.ensemble);
        const idx = this.ensembles.findIndex(e => e.id === this.editId);
        this.ensembles[idx] = res.data;
      } else {
        const res = await axios.post('http://localhost:3000/api/ensembles', this.ensemble);
        this.ensembles.push(res.data);
      }
      this.closeModal();
    },
    async remove(id) {
      await axios.delete(`http://localhost:3000/api/ensembles/${id}`);
      this.ensembles = this.ensembles.filter(e => e.id !== id);
    },
    showDetails(ensemble) {
      this.selected = {...ensemble};
      this.selected.details = this.getMockDetails(ensemble.id);
      this.showDetailsModal = true;
    },
    getMockDetails(id) {
      const fallback = {
        1: {
          compositionCount: 10,
          cds: ['Berlin Classics', 'Golden Concerts'],
          bestSellers: ['Golden Concerts']
        },
        2: {
          compositionCount: 5,
          cds: ['Vienna Nights', 'Live Quartet'],
          bestSellers: ['Live Quartet']
        },
        3: {
          compositionCount: 7,
          cds: ['Jazz Fire', 'Fusion Live'],
          bestSellers: ['Jazz Fire']
        },
        4: {
          compositionCount: 12,
          cds: ['London Majesty'],
          bestSellers: ['London Majesty']
        },
        5: {
          compositionCount: 6,
          cds: ['String Fusion 1', 'String Fusion 2'],
          bestSellers: ['String Fusion 2']
        }
      };
      return fallback[id] || {
        compositionCount: 0,
        cds: ['Нет данных'],
        bestSellers: []
      };
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
