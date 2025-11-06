<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import {
  IonList,
  IonListHeader,
  IonItem,
  IonRadio,
  IonRadioGroup,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/vue';
import { ComponentProps } from '@/types';
import { useStorage } from '@/composables/useStorage';

const props = defineProps<ComponentProps>();
const { storageSet, storageGet } = useStorage();

const data = ref();

const saveData = async () => {
  await storageSet(props.id, data.value);
};

onMounted(async () => {
  const storedData = await storageGet(props.id);
  if (storedData) {
    data.value = storedData;
  }
});

const isComplete = computed(() => {
  return !!data.value;
});

defineExpose({
  isComplete,
});
</script>

<template>
  <ion-grid class="combo-box ion-no-padding ion-margin-bottom">
    <ion-row>
      <ion-col>
        <ion-list>
          <ion-radio-group v-model="data" @ionChange="saveData">
            <ion-list-header>{{ label }}:</ion-list-header>
            <ion-item v-for="option in options" :key="option" lines="none">
              <ion-radio :value="option" label-placement="end" justify="start" mode="md">{{
                option
              }}</ion-radio>
            </ion-item>
          </ion-radio-group>
        </ion-list>
      </ion-col>
    </ion-row>
  </ion-grid>
</template>

<style lang="css" scoped>
ion-list {
  border: 2px solid #dedede;
  border-radius: 4px;
}
</style>
