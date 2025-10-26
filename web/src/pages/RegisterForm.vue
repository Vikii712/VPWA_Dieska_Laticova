<script setup lang="ts">
import { useQuasar } from "quasar";
import { ref } from "vue";
import { useRouter } from "vue-router";

const $q = useQuasar();
const router = useRouter();

const nick = ref<string | null>(null);
const name = ref<string | null>(null);
const lastName = ref<string | null>(null);
const email = ref<string | null>(null);
const password = ref<string | null>(null);

function onSubmit(): void {
  $q.notify({
    color: "green-8",
    textColor: "white",
    message: "Registered",
  });

  void router.push("/main");
}

function onReset(): void {
  nick.value = null;
  name.value = null;
  lastName.value = null;
  email.value = null;
  password.value = null;
}
</script>

<template>
  <div class="row justify-center">
    <div class="col-2 col-md-1">
      <img src="../assets/images/user_icon.svg" alt="user icon" class="full-width" />
    </div>
  </div>
  <div class="row justify-center">
    <div class="col-11 col-md-8 col-lg-6 q-pa-lg bg-deep-purple-3">
      <q-form
          @submit = "onSubmit"
          @reset = "onReset"
          greedy

      >
        <q-input
          outlined
          v-model="nick"
          label="Enter your NickName*"
          bg-color="deep-purple-1"
          maxlength="24"
          :rules="[val => (val && val.length > 0) || 'NickName required']"
        />
        <div class="row q-col">
          <div class="col-6">
            <q-input
              outlined
              v-model="name"
              label="Enter your name*"
              bg-color="deep-purple-1"
              maxlength="20"
              :rules="[val => (val && val.length > 0) || 'Name required']"
            />
          </div>
          <div class="col-6">
            <q-input
              outlined
              v-model="lastName"
              label="Enter your surname*"
              bg-color="deep-purple-1"
              maxlength="20"
              :rules="[val => (val && val.length > 0) || 'Surname required']"
            />
          </div>
        </div>
        <q-input
            outlined
            v-model="email"
            type="email"
            label="Enter your email*"
            bg-color="deep-purple-1"
            lazy-rules
            :rules="[val => !!val || 'Entering email is required',
        (val, rules) => rules.email(val) || 'Please enter a valid email']"
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

        <div class="grid row justify-between items-center">
          <div class="">
            <q-btn label="Register" type="submit" color="accent" />
            <q-btn label="Reset" type="reset" color="accent" flat class="q-pa-sm q-pl-md"/>
          </div>
          <div class="justify-end">
            <q-btn to="/login" label="Login" color="purple"/>
          </div>
        </div>
      </q-form>
    </div>
  </div>
</template>

<style scoped>
</style>
