<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import api from './api';

interface Item {
  id: string;
  label: string;
  type: 'textarea' | 'text';
}

interface Phase {
  id: string;
  title: string;
  items: Item[];
}

const phases: Phase[] = [
  {
    id: 'requirements',
    title: '要件定義',
    items: [
      { id: 'req_purpose', label: 'システム導入の目的 (解決したい課題、DX推進など)', type: 'textarea' },
      { id: 'req_users', label: '対象ユーザー・規模 (従業員数、拠点数)', type: 'textarea' },
      { id: 'req_roles', label: '権限設定 (管理者、人事、一般、マネージャー等)', type: 'textarea' },
      { id: 'req_security', label: '個人情報保護・セキュリティ要件', type: 'textarea' },
    ]
  },
  {
    id: 'basic_design',
    title: '基本設計',
    items: [
      { id: 'design_screens', label: '主要画面構成 (ダッシュボード、社員一覧、詳細)', type: 'textarea' },
      { id: 'design_search', label: '検索・フィルタ条件 (氏名、所属、スキル等)', type: 'textarea' },
      { id: 'design_integration', label: '外部連携要件 (Slack、給与、勤怠等)', type: 'textarea' },
      { id: 'design_export', label: 'データ出力形式 (CSV、Excel、PDF)', type: 'textarea' },
    ]
  },
  {
    id: 'operations',
    title: '運用・インフラ',
    items: [
      { id: 'ops_backup', label: 'バックアップ頻度と保存期間', type: 'textarea' },
      { id: 'ops_2fa', label: 'セキュリティ認証 (2FA、IP制限等)', type: 'textarea' },
      { id: 'ops_support', label: 'サポート・保守体制 (窓口、連絡ルート)', type: 'textarea' },
    ]
  }
];

const responses = ref<Record<string, string>>({});
const currentPhaseId = ref(phases[0].id);
const saving = ref(false);

const currentPhase = computed(() => phases.find(p => p.id === currentPhaseId.value));

const progress = computed(() => {
  const totalItems = phases.reduce((acc, p) => acc + p.items.length, 0);
  const filledItems = Object.values(responses.value).filter(v => v.trim() !== '').length;
  return Math.round((filledItems / totalItems) * 100);
});

onMounted(async () => {
  try {
    const res = await api.get('/hearing');
    responses.value = res.data;
  } catch (err) {
    console.error('Failed to load data', err);
  }
});

const save = async () => {
  saving.value = true;
  try {
    await api.post('/hearing', responses.value);
    alert('保存しました');
  } catch (err) {
    alert('保存に失敗しました');
  } finally {
    saving.value = false;
  }
};

const exportData = () => {
  const data = JSON.stringify(responses.value, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hearing_results_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
};
</script>

<template>
  <div class="app-container">
    <aside class="sidebar">
      <h2>ヒアリング・ナビ</h2>
      <nav>
        <ul>
          <li 
            v-for="phase in phases" 
            :key="phase.id"
            :class="{ active: currentPhaseId === phase.id }"
            @click="currentPhaseId = phase.id"
          >
            {{ phase.title }}
          </li>
        </ul>
      </nav>
      <div class="progress-box">
        <p>全体の進捗: {{ progress }}%</p>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
      </div>
      <div class="actions">
        <button @click="save" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</button>
        <button @click="exportData" class="btn-secondary">エクスポート (JSON)</button>
      </div>
    </aside>

    <main class="content">
      <header>
        <h1>{{ currentPhase?.title }} フェーズ</h1>
      </header>
      <section class="form-section" v-if="currentPhase">
        <div v-for="item in currentPhase.items" :key="item.id" class="form-group">
          <label :for="item.id">{{ item.label }}</label>
          <textarea 
            :id="item.id" 
            v-model="responses[item.id]" 
            placeholder="ヒアリング内容を入力..."
          ></textarea>
        </div>
      </section>
    </main>
  </div>
</template>

<style>
:root {
  --primary: #4f46e5;
  --secondary: #64748b;
  --bg: #f8fafc;
  --sidebar-bg: #1e293b;
  --text-light: #f1f5f9;
}

body {
  margin: 0;
  font-family: 'Inter', sans-serif;
  background-color: var(--bg);
  color: #1e293b;
}

.app-container {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: 280px;
  background-color: var(--sidebar-bg);
  color: var(--text-light);
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
}

.sidebar h2 {
  font-size: 1.25rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid #334155;
  padding-bottom: 1rem;
}

.sidebar nav ul {
  list-style: none;
  padding: 0;
  margin: 0 0 2rem 0;
}

.sidebar nav li {
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  margin-bottom: 0.5rem;
  transition: background 0.2s;
}

.sidebar nav li:hover {
  background-color: #334155;
}

.sidebar nav li.active {
  background-color: var(--primary);
}

.progress-box {
  margin-top: auto;
  margin-bottom: 2rem;
}

.progress-bar {
  background: #334155;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 0.5rem;
}

.progress-fill {
  background: var(--primary);
  height: 100%;
  transition: width 0.3s ease;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

button {
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: none;
  background-color: var(--primary);
  color: white;
  font-weight: 600;
  cursor: pointer;
}

button:disabled {
  opacity: 0.5;
}

.btn-secondary {
  background-color: var(--secondary);
}

.content {
  flex: 1;
  padding: 3rem;
  overflow-y: auto;
}

.content h1 {
  font-size: 1.875rem;
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 2rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

textarea {
  width: 100%;
  min-height: 120px;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid #cbd5e1;
  font-family: inherit;
  resize: vertical;
}

textarea:focus {
  outline: 2px solid var(--primary);
  border-color: transparent;
}
</style>
