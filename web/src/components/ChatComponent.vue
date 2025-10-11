<script setup lang="ts">
import user1 from '../assets/images/profile_pic.svg'
import user2 from '../assets/images/PieMan.svg'
</script>

<template>
  <q-infinite-scroll>
      <q-timeline color="deep-purple-6" class="q-px-lg q-pb-xl" layout='dense'>
        <q-timeline-entry
          v-for="i in 10"
          :key="i"
          :title="i % 2 === 0 ? 'You' : 'Raspberry Pi'"
          :subtitle="i % 2 === 0 ? 40 - i*2 + ' minutes ago' :  40 - i*2 + ' minutes ago'"
          :color="i % 2 === 0 ? 'teal' : 'blue-grey'"
          :avatar="i % 2 === 0 ? user1 : user2"
          class="text-white"
        >
          <div
            class="q-pa-sm text-white"
            :class="i % 2 === 0 ? 'bg-teal-10' : 'bg-blue-grey-10'"
          >
            {{ i % 2 === 0 ? 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.' : '"Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.' }}
          </div>
          <q-separator class="q-mb-0 q-mt-sm sep rounded-borders"/>
        </q-timeline-entry>

        <q-timeline-entry
          color="blue-grey"
          :avatar=user2
          class="text-white">
          <template #title>
            <span>
              Raspberry Pi
              <q-tooltip class="bg-grey-9 text-subtitle2">
               My jokes are crispier than yours
              </q-tooltip>
            </span>
          </template>
          <q-spinner-dots size="2rem" />
        </q-timeline-entry>

      </q-timeline>
  </q-infinite-scroll>
</template>
<style scoped>

.sep {
  height: 2px;
  background-color: dimgray;
}

</style>
