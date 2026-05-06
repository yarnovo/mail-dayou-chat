<script setup>
defineProps({
  urls: { type: Array, required: true },
})
</script>

<template>
  <div class="grid grid-cols-2 gap-2 my-2 max-w-md" data-testid="avatar-grid">
    <a
      v-for="(url, i) in urls"
      :key="i"
      :href="url"
      target="_blank"
      rel="noopener"
      class="block rounded-xl overflow-hidden bg-akong-paper border border-akong-border hover:border-akong-accent transition-colors active:scale-[0.98]"
      :data-testid="`avatar-${i}`"
    >
      <img
        :src="url"
        :alt="`头像 ${i + 1}`"
        loading="lazy"
        class="w-full aspect-square object-cover"
      />
    </a>
  </div>
</template>
