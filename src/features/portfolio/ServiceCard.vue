<script setup lang="ts">
defineProps({
  icon: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
})
</script>

<template>
  <article class="service-card group flex flex-col rounded-xl bg-svc-2 p-[2.5rem_2rem]">
    <div
      class="service-icon mb-6 flex h-[60px] w-[60px] items-center justify-center rounded-xl border border-svc-4 bg-svc-1 text-svc-4"
    >
      <i class="fas text-xl" :class="icon"></i>
    </div>
    <h3 class="service-title mb-4 font-bold text-svc-3">{{ title }}</h3>
    <p class="mb-6 flex-grow text-svc-3 opacity-85">{{ description }}</p>
  </article>
</template>

<style scoped>
.service-card {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-top: 4px solid var(--svc-color-4);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
  transition: all var(--transition-normal);
}
.service-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
  border-color: var(--svc-color-5);
  border-top-color: var(--svc-color-5);
}

.service-icon {
  transition: all var(--transition-normal);
}
.service-card:hover .service-icon {
  background-color: var(--svc-color-4);
  color: var(--svc-color-2);
}

.service-title {
  font-size: var(--size-titles);
  line-height: 1.2;
}
</style>
