<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import {
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonListHeader,
  IonItem,
  IonRadio,
  IonRadioGroup,
  IonCheckbox,
} from '@ionic/vue';
import { ComponentProps } from '@/types';
import { useStorage } from '@/composables/useStorage';

interface OptionType {
  option: string;
  value: boolean;
}

const props = defineProps<ComponentProps>();

const { storageSetJson, storageGetJson } = useStorage();
const selectedItem = ref('');
const data = ref<OptionType[]>([]);
const fieldBool = ref(false);

// Initialize checkbox data from options
const initializeCheckboxData = () => {
  if (props.options && Array.isArray(props.options)) {
    data.value = props.options;
  }
};

const saveData = async () => {
  if (!fieldBool.value) {
    // For radio buttons, update data array based on selectedItem
    data.value = data.value.map((item) => ({
      ...item,
      value: item.option === selectedItem.value,
    }));
  }

  // Save the updated data to storage
  await storageSetJson(props.id, data.value);
};

onMounted(async () => {
  fieldBool.value = props.field == 'true' || props.field == '1';

  // Load stored data
  const storedData = await storageGetJson(props.id);
  if (storedData) {
    data.value = storedData;
    if (!fieldBool.value) {
      const item = data.value.filter((item) => item.value == true);
      if (item.length > 0) selectedItem.value = item[0].option;
    }
  } else {
    initializeCheckboxData();
  }
});

const isComplete = computed(() => {
  if (fieldBool.value) {
    // For checkboxes, check if at least one option is selected
    return data.value.some((item) => item.value);
  } else {
    // For radio buttons, check if a value is selected
    return !!selectedItem.value;
  }
});

defineExpose({
  isComplete,
});
</script>

<template>
  <ion-grid class="checkbox-radio ion-no-padding ion-margin-bottom">
    <ion-row>
      <ion-col v-if="fieldBool">
        <ion-list>
          <ion-list-header>{{ label }}:</ion-list-header>
          <ion-item lines="none" v-for="(item, i) in data" :key="i">
            <ion-checkbox
              v-model="item.value"
              @ionChange="saveData"
              label-placement="end"
              justify="start"
              mode="md"
              >{{ item.option }}</ion-checkbox
            >
          </ion-item>
        </ion-list>
      </ion-col>
      <ion-col v-else>
        <ion-list>
          <ion-radio-group v-model="selectedItem" @ionChange="saveData">
            <ion-list-header>{{ label }}:</ion-list-header>
            <ion-item lines="none" v-for="(item, i) in options" :key="i">
              <ion-radio :value="item.option" label-placement="end" justify="start" mode="md">{{
                item.option
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
