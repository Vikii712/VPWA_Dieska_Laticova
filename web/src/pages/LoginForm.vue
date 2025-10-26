<script setup lang="ts">
  import { useQuasar } from "quasar";
  import { ref } from "vue";
  import { useRouter } from "vue-router";

  const $q = useQuasar();
  const router = useRouter();

  const email = ref<string | null>(null);
  const password = ref<string | null>(null);

  function onSubmit(): void {
    $q.notify({
      color: "green-8",
      textColor: "white",
      message: "Logged-in",
    });

    void router.push("/main");
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
            label="Enter your email*"
            bg-color="deep-purple-1"
            class=""
            lazy-rules
            :rules="[val => !!val || 'Entering email is required',
        (val, rules) => rules.email(val) || 'Please, enter a valid email']"
        />
        <q-input
            outlined
            v-model="password"
            type="password"
            label="Enter your password*"
            bg-color="deep-purple-1"
            lazy-rules
            :rules="[val => !!val || 'Please, enter your password',
        val => val.length >= 8 || 'Please, enter 8 or more characters']"
        />

        <div class="grid row justify-between  items-center">
          <div class="q-pt-md">
            <q-btn label="Log-in" type="submit" color="accent" />
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
