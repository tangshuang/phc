<template>
    <span>{{ message }}</span>
    <button @click="change">change</button>
</template>

<script setup>
const { ref } = Vue;

const message = ref('Hello vue!')
const change = () => message.value = 'I am changed';

export { message, change };
</script>