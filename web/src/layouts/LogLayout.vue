<script setup lang="ts">
</script>

<template>
  <q-layout class="bg-purple-10" view="hHh LpR fFf">
    <q-header class="row items-center bg-transparent">
      <img src="../assets/images/logo.svg" alt="logo" width="100">
      <p class="q-ma-none q-ml-md ">"Slack with flavoured chats, spilling tea in stacks"</p>
    </q-header>

    <q-page-container class="content-center">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<style scoped>

</style>
