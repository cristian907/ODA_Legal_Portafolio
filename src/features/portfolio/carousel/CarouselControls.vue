<script setup lang="ts">
const props = defineProps<{
  pageCount: number
  activePage: number
}>()

const emit = defineEmits<{
  page: [page: number]
}>()
</script>

<template>
  <div class="flex flex-wrap items-center justify-center gap-1" role="group" aria-label="Páginas de fotos">
    <button
      v-for="page in props.pageCount"
      :key="page"
      type="button"
      class="dot-hit"
      :aria-label="`Ir a la página ${page} de ${props.pageCount}`"
      :aria-current="page - 1 === props.activePage ? 'true' : undefined"
      @click="emit('page', page - 1)"
    >
      <span class="dot" aria-hidden="true"></span>
    </button>
  </div>
</template>

<style scoped>
.dot-hit:focus-visible {
  outline: 2px solid var(--svc-color-4);
  outline-offset: 3px;
}

/* 24px hit area around a small visual dot. */
.dot-hit {
  display: inline-flex;
  height: 24px;
  min-width: 24px;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  cursor: pointer;
}
.dot {
  display: block;
  height: 8px;
  width: 8px;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--svc-color-3) 28%, transparent);
  transition:
    width var(--transition-normal),
    background-color var(--transition-normal);
}
.dot-hit:hover .dot {
  background: color-mix(in srgb, var(--svc-color-3) 55%, transparent);
}
.dot-hit[aria-current='true'] .dot {
  width: 24px;
  background: var(--svc-color-4);
}

@media (prefers-reduced-motion: reduce) {
  .dot {
    transition: none;
  }
}
</style>
