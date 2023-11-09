<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup>
const message = reactive()
async function submit() {
  const { body } = await $fetch('/api/submit', {
    method: 'post',
    body: { test: 123 }
  })
  console.log(body)
}
console.log(submit())
</script>