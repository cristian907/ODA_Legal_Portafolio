<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { useToast } from '@/composables/useToast'
import LoginScreen from './LoginScreen.vue'
import GeneralView from './GeneralView.vue'
import LibraryView from './LibraryView.vue'
import EditorView from './EditorView.vue'
import LivePreview from './LivePreview.vue'
import CvWizard from '@/features/cv-wizard/CvWizard.vue'
import CvPreviewPanel from '@/features/cv-wizard/CvPreviewPanel.vue'
import ToastHost from '@/components/feedback/ToastHost.vue'
import ConfirmModal from '@/components/feedback/ConfirmModal.vue'
import type { SavedStyle, ThemeName } from '@/types/theme'

const auth = useAuthStore()
const theme = useThemeStore()
const { show } = useToast()

type AdminModule = 'styles' | 'cv'
type StylesView = 'general' | 'library' | 'editor'
type ReturnView = 'general' | 'library'

const activeModule = ref<AdminModule>('styles')
const view = ref<StylesView>('general')
const editorReturnView = ref<ReturnView>('general')

onMounted(() => theme.loadEditorState())

function openEditor(
  style: SavedStyle | null,
  returnView: ReturnView,
  presetTheme?: ThemeName | null,
) {
  theme.openDraft(style, presetTheme ?? undefined)
  editorReturnView.value = returnView
  view.value = 'editor'
}
function closeEditor() {
  theme.closeDraft()
  view.value = editorReturnView.value
}
function saveEditor() {
  const result = theme.saveDraft(theme.draft?.name ?? '')
  if (!result.ok) {
    show(result.message ?? 'No se pudo guardar el estilo', 'error')
    return
  }
  view.value = editorReturnView.value
  show(`Estilo "${result.name}" guardado y activado`)
}

// Navigation intents from the views
const onCreate = (presetTheme: ThemeName | null, from: ReturnView) =>
  openEditor(null, from, presetTheme)
const onEdit = (style: SavedStyle | null, from: ReturnView) =>
  style && openEditor(style, from)

function logout() {
  auth.logout()
}

// CV module: refit the A4 sheet whenever it becomes visible.
const cvPreview = ref<{ autoFit: () => void; downloadPdf: () => Promise<void> } | null>(null)
watch(activeModule, (m) => {
  if (m === 'cv') nextTick(() => cvPreview.value?.autoFit())
})
</script>

<template>
  <LoginScreen v-if="!auth.isLoggedIn" />

  <div v-else class="flex h-screen flex-col bg-[#0b0f17] text-white">
    <!-- Topbar -->
    <header class="flex h-[70px] shrink-0 items-center justify-between border-b border-[#1e293b] px-6">
      <div class="flex items-center gap-4">
        <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-[#c5a059] text-[#0f172a]">
          <i class="fas fa-balance-scale"></i>
        </span>
        <span class="hidden font-semibold sm:inline">Panel de Control | ODA Legal</span>

        <nav class="ml-2 flex gap-1 rounded-lg border border-[#c5a059]/20 bg-white/5 p-1">
          <button
            class="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold transition"
            :class="
              activeModule === 'styles'
                ? 'bg-gradient-to-br from-[#c5a059] to-[#b38e44] text-[#0f172a]'
                : 'text-slate-400 hover:text-white'
            "
            @click="activeModule = 'styles'"
          >
            <i class="fas fa-palette"></i> Estilos
          </button>
          <button
            class="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold transition"
            :class="
              activeModule === 'cv'
                ? 'bg-gradient-to-br from-[#c5a059] to-[#b38e44] text-[#0f172a]'
                : 'text-slate-400 hover:text-white'
            "
            @click="activeModule = 'cv'"
          >
            <i class="fas fa-id-card"></i> Creación de CV
          </button>
        </nav>
      </div>

      <div class="flex items-center gap-3">
        <span class="hidden items-center gap-2 text-sm text-slate-400 md:flex">
          <i class="fas fa-user-shield"></i> Lic. Oscar De Abreu (Admin)
        </span>
        <RouterLink
          to="/"
          target="_blank"
          class="hidden rounded-lg border border-[#1e293b] px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/5 sm:inline-flex"
        >
          <i class="fas fa-external-link-alt"></i> Ver Sitio
        </RouterLink>
        <button
          class="rounded-lg border border-red-500/40 px-3 py-1.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
          @click="logout"
        >
          <i class="fas fa-power-off"></i> Salir
        </button>
      </div>
    </header>

    <!-- Two-column dashboard -->
    <main
      class="grid min-h-0 flex-1"
      :style="{ gridTemplateColumns: activeModule === 'cv' ? '45% 55%' : '32% 68%' }"
    >
      <!-- Controls panel -->
      <div class="flex min-h-0 flex-col border-r border-[#1e293b] bg-[#0b0f17]">
        <template v-if="activeModule === 'styles'">
          <!-- Tabs (hidden in editor) -->
          <div v-if="view !== 'editor'" class="flex gap-1 border-b border-[#1e293b] px-5 pt-3">
            <button
              class="flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition"
              :class="
                view === 'general'
                  ? 'border-[#c5a059] text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              "
              @click="view = 'general'"
            >
              <i class="fas fa-sliders-h"></i> General
            </button>
            <button
              class="flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition"
              :class="
                view === 'library'
                  ? 'border-[#c5a059] text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              "
              @click="view = 'library'"
            >
              <i class="fas fa-bookmark"></i> Biblioteca
              <span class="rounded-full bg-[#c5a059]/20 px-2 text-xs text-[#e5be48]">
                {{ theme.savedStyles.length }}
              </span>
            </button>
          </div>

          <!-- Scrollable view -->
          <div class="min-h-0 flex-1 overflow-y-auto p-5">
            <GeneralView
              v-if="view === 'general'"
              @create="onCreate($event, 'general')"
              @edit="onEdit($event, 'general')"
              @change="view = 'library'"
            />
            <LibraryView
              v-else-if="view === 'library'"
              @create="onCreate($event, 'library')"
              @edit="onEdit($event, 'library')"
            />
            <EditorView v-else-if="view === 'editor'" @back="closeEditor" />
          </div>

          <!-- Editor action bar -->
          <div v-if="view === 'editor'" class="flex gap-3 border-t border-[#1e293b] p-4">
            <button class="btn-primary flex-1" @click="saveEditor">
              <i class="fas fa-check-circle"></i>
              {{ theme.draft?.id ? 'Guardar cambios' : 'Guardar estilo' }}
            </button>
            <button
              class="rounded-lg border border-[#1e293b] px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/5"
              @click="closeEditor"
            >
              Cancelar
            </button>
          </div>
        </template>

        <!-- CV module -->
        <CvWizard v-else @download="cvPreview?.downloadPdf()" />
      </div>

      <!-- Preview panel -->
      <div class="flex min-h-0 flex-col bg-[#111827]">
        <template v-if="activeModule === 'styles'">
          <div class="flex shrink-0 items-center justify-between border-b border-[#1e293b] px-5 py-3">
            <h3 class="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <i class="fas fa-eye"></i> Vista Previa en Tiempo Real
            </h3>
            <span class="flex items-center gap-1.5 text-xs text-emerald-400">
              <i class="fas fa-circle text-[0.5rem]"></i> En Vivo
            </span>
          </div>
          <div class="min-h-0 flex-1">
            <LivePreview :config="theme.previewConfig" />
          </div>
        </template>

        <CvPreviewPanel v-else ref="cvPreview" />
      </div>
    </main>

    <ToastHost />
    <ConfirmModal />
  </div>
</template>
