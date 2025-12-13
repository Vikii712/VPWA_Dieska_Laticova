<script setup lang="ts">
import { useQuasar } from "quasar";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "src/stores/auth";

const $q = useQuasar();
const router = useRouter();
const auth = useAuthStore();

const form = ref({
  email: '',
  password: '',
  isPwd: true,
})

async function onSubmit() {
  try {
    await auth.login(form.value)
    $q.notify({
      color: "green-8",
      textColor: "white",
      icon: "check_circle",
      message: "Successfully logged in!",
      position: "top"
    });
    void router.push("/main");
  } catch (error) {
    $q.notify({
      color: "red-8",
      textColor: "white",
      icon: "error",
      message: error instanceof Error ? error.message : "Login failed",
      timeout: 5000,
      position: "top"
    });
  }
}

function onReset(): void {
  form.value.email = '';
  form.value.password = '';
}
</script>

<template>
  <div class="row justify-center align-center">
    <div class="col-2 col-md-1">
      <img src="../assets/images/user_icon.svg" alt="user icon" class="full-width" />
    </div>
  </div>
  <div class="row q-col-gutter justify-center">
    <div class="col-11 col-md-8 col-lg-6 q-pa-md sm:q-pa-lg bg-deep-purple-3">
      <q-form @submit="onSubmit" @reset="onReset">
        <q-input
          outlined
          v-model="form.email"
          type="email"
          label="Enter your email*"
          bg-color="deep-purple-1"
          maxlength="40"
          lazy-rules
          :rules="[
            val => !!val || 'Email required',
            (val, rules) => rules.email(val) || 'Valid email required'
          ]"
        />
        <q-input
          outlined
          v-model="form.password"
          :type="form.isPwd ? 'password' : 'text'"
          label="Enter your password*"
          bg-color="deep-purple-1"
          maxlength="30"
          lazy-rules
          :rules="[
            val => !!val || 'Password required',
            val => val.length >= 8 || 'Min 8 characters required'
          ]">
          <template v-slot:append>
            <q-icon
              :name="form.isPwd ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="form.isPwd = !form.isPwd"
            />
          </template>
        </q-input>
        <div class="row justify-between items-center q-pt-md">
          <div>
            <q-btn label="Log-in" type="submit" color="accent" />
            <q-btn label="Reset" type="reset" color="accent" flat class="q-ml-sm"/>
          </div>
          <q-btn to="/register" label="Register" color="purple"/>
        </div>
      </q-form>
    </div>
  </div>
</template>
