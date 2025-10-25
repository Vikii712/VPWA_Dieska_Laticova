<script setup lang="ts">
  import { useQuasar } from "quasar";
  import { ref } from "vue";

  const $q = useQuasar();

  const email = ref<string | null>(null);
  const password = ref<string | null>(null);

  function onSubmit(): void {
    $q.notify({
      color: "green-4",
      textColor: "white",
      icon: "cloud-done",
      message: "Prihlásený",
    });
  }

  function onReset(): void {
    email.value = null;
    password.value = null;
  }
</script>


<template>
  <div class="row justify-center align-center">
    <div class="col-2 col-md-1">
      <img src="../assets/images/user_icon.svg" alt="user icon" class="full-width" />
    </div>
  </div>
  <div class="row q-col-gutter justify-center">
    <div class="col-11 col-md-8 col-lg-6 q-pa-lg bg-deep-purple-3">
      <q-form
          @submit = "onSubmit"
          @reset = "onReset"


      >
        <q-input
            outlined
            v-model="email"
            type="email"
            label="Zadaj Email*"
            bg-color="deep-purple-1"
            class=""
            lazy-rules
            :rules="[val => !!val || 'Zadanie emailu je povinné',
        (val, rules) => rules.email(val) || 'Prosím, zadajte validný email']"
        />
        <q-input
            outlined
            v-model="password"
            type="password"
            label="Zadaj Heslo*"
            bg-color="deep-purple-1"
            lazy-rules
            :rules="[val => !!val || 'Prosím, zadajte heslo',
        val => val.length >= 8 || 'Prosím, zadajte 8 alebo viac znakov']"
        />

        <div class="grid row justify-between  items-center">
          <div class="q-pt-md">
            <q-btn to="/main" label="Log-in" type="submit" color="accent" />
            <q-btn label="Reset" type="reset" color="accent" flat class="q-pa-sm q-pl-md"/>
          </div>
          <div class="justify-end q-pt-md">
            <q-btn to="/register" label="Register" color="purple"/>
          </div>
        </div>
      </q-form>
    </div>
  </div>
</template>

<style scoped>
</style>
