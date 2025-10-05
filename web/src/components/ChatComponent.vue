<script setup lang="ts">
import user1 from '../assets/images/profile_pic.svg'
import user2 from '../assets/images/user_icon.svg'
</script>

<template>
  <q-infinite-scroll>
    <div class="q-mt-xl q-px-lg">
      <q-timeline color="deep-purple-7">
        <q-timeline-entry
          v-for="i in 10"
          :key="i"
          :subtitle="i % 2 === 0 ? 'You' : 'Raspberry Pi'"
          :color="i % 2 === 0 ? 'teal-6' : 'deep-purple-6'"
          :avatar="i % 2 === 0 ? user1 : user2"
        >
          <div
            class="q-pa-sm text-white"
            :class="i % 2 === 0 ? 'bg-teal-6' : 'bg-deep-purple-6'"
          >
            {{ i % 2 === 0 ? 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.' : '"Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.' }}
          </div>
          <q-separator class="q-mb-0 q-mt-sm sep rounded-borders"/>
        </q-timeline-entry>
      </q-timeline>
    </div>
  </q-infinite-scroll>
</template>
<style scoped>

.sep {
  height: 2px;
  background-color: blueviolet;
}

</style>
