<script>
  import RegisterForm from "@/components/RegisterForm.vue";
  import LoginForm from "@/components/LoginForm.vue";

  export default {
    components: {
      RegisterForm: RegisterForm,
      LoginForm: LoginForm
    }
  }
</script>

<template>
  <q-layout class="content-center bg-purple-10">
    <router-view />
  </q-layout>
</template>
