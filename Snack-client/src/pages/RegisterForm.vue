<script setup lang="ts">
import { useQuasar } from "quasar";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "src/stores/auth";

const $q = useQuasar();
const router = useRouter();
const auth = useAuthStore();
const isPwd = ref(true)

const form = ref({
  nick: '',
  name: '',
  lastName: '',
  email: '',
  password: '',
  activity_status: 'active',
})

async function onSubmit() {
  try {
    await auth.register(form.value)
    $q.notify({
      color: "green-8",
      textColor: "white",
      icon: "check_circle",
      message: "Successfully registered!",
      position: "top"
    });
    void router.push("/main");
  } catch (error) {
    $q.notify({
      color: "red-8",
      textColor: "white",
      icon: "error",
      message: error instanceof Error ? error.message : "Registration failed",
      timeout: 5000,
      position: "top"
    });
  }
}

function onReset(): void {
  Object.keys(form.value).forEach(key => {
    form.value[key as keyof typeof form.value] = '';
  });
}
</script>

<template>
  <div class="row justify-center">
    <div class="col-2 col-md-1">
      <img src="../assets/images/user_icon.svg" alt="user icon" class="full-width" />
    </div>
  </div>
  <div class="row justify-center">
    <div class="col-11 col-md-8 col-lg-6 q-pa-md sm:q-pa-lg bg-deep-purple-3">
      <q-form @submit="onSubmit" @reset="onReset" greedy>
        <q-input
          outlined
          v-model="form.nick"
          label="Enter your NickName*"
          bg-color="deep-purple-1"
          maxlength="24"
          :rules="[val => (val && val.length > 0) || 'NickName required']"
        />
        <div class="row q-col-gutter-sm">
          <div class="col-6">
            <q-input
              outlined
              v-model="form.name"
              label="Enter your name*"
              bg-color="deep-purple-1"
              maxlength="30"
              :rules="[val => (val && val.length > 0) || 'Name required']"
            />
          </div>
          <div class="col-6">
            <q-input
              outlined
              v-model="form.lastName"
              label="Enter your surname*"
              bg-color="deep-purple-1"
              maxlength="30"
              :rules="[val => (val && val.length > 0) || 'Surname required']"
            />
          </div>
        </div>
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
          :type="isPwd ? 'password' : 'text'"
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
              :name="isPwd ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="isPwd = !isPwd"
            />
          </template>
        </q-input>
        <div class="row justify-between items-center">
          <div>
            <q-btn label="Register" type="submit" color="accent" />
            <q-btn label="Reset" type="reset" color="accent" flat class="q-ml-sm"/>
          </div>
          <q-btn to="/login" label="Login" color="purple"/>
        </div>
      </q-form>
    </div>
  </div>
</template>
