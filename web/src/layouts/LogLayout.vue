<script setup lang="ts">
</script>

<template>
  <q-layout class="bg-purple-10 content-center" view="hHh LpR fFf">
    <q-header class="row items-center bg-transparent q-pa-md " elevated>

      <div class="flex items-center">
        <img src="../assets/images/logo.svg" alt="logo" width="100" class="rounded-md">
      </div>

      <div class="q-ml-md">
        <p class="q-ma-none q-mt-xs text-subtitle1 text-weight-medium text-italic text-deep-purple-2" style="line-height: 1.2;">
          "Slack with flavoured chats, spilling tea in stacks"
        </p>
      </div>
    </q-header>

    <q-page-container class="content-center">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<style scoped>

</style>
