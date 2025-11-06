<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import {
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonListHeader,
  IonItem,
  IonRadio,
  IonRadioGroup,
} from '@ionic/vue';
import { ComponentProps } from '@/types';
import { useStorage } from '@/composables/useStorage';
import { useI18n } from 'vue-i18n';
import MultiTakePicture from '@/components/MultiTakePicture.vue';
import MultiTakePictureRemarks from '@/components/MultiTakePictureRemarks.vue';
import TakePicture from '@/components/TakePicture.vue';
import Remarks from '@/components/RemarksComponent.vue';
import MultiRemarks from '@/components/MultiRemarks.vue';
import PalletizedCargo from '@/components/PalletizedCargo.vue';
import ProductDescription from '@/components/ProductDescription.vue';
import ComboBox from '@/components/ComboBox.vue';
import FormInput from '@/components/FormInput.vue';

const props = defineProps<ComponentProps>();
const { t } = useI18n();
const { storageGetJson, storageSetJson, storageRemove } = useStorage();

const data = ref<any[]>([]);
const opt = ref({
  option: '',
  field: '',
  condition: false,
});
const myKey = ref(0);

// Add refs for conditional components
const conditionalComponentRef = ref<any>({});

watch(data, (newVal) => {
  props.options.forEach((element: any) => {
    if (newVal === element.option) {
      opt.value = element;
    }
  });
});

const saveData = async () => {
  if (!data.value) return;

  await storageSetJson(props.id, {
    type: 'cb-group',
    show: props.field,
    value: data.value,
    options: props.options,
  });
  await storageRemove(props.id + '-combo-box-condition');
  await nextTick();
  myKey.value++;
};

onMounted(async () => {
  const storedData = await storageGetJson(props.id);
  if (storedData) {
    data.value = storedData.value;
  }
});

const isConditionalComponentActive = computed(() => {
  return (
    [
      'multi-take-picture',
      'multi-take-picture-remarks',
      'take-picture',
      'remarks',
      'multi-remarks',
      'palletized-cargo',
      'product-description',
      'combo-box',
      'input-text',
      'input-number',
    ].includes(opt.value.field) && opt.value.condition
  );
});

const isComplete = computed(() => {
  // If a conditional component is active, check its isComplete
  if (isConditionalComponentActive.value) {
    return data.value && data.value.length > 0 && conditionalComponentRef.value[opt.value.field]?.isComplete;
  }
  // Otherwise, just check data has a meaningful value
  return data.value && data.value.length > 0;
});

defineExpose({
  isComplete,
});
</script>

<template>
  <div class="combo-box-condition ion-margin-bottom">
    <ion-grid class="ion-no-padding ion-margin-bottom">
      <ion-row>
        <ion-col>
          <ion-list>
            <ion-radio-group v-model="data" @ionChange="saveData">
              <ion-list-header>{{ label }}:</ion-list-header>
              <ion-item v-for="option in options" :key="option.option" lines="none">
                <ion-radio
                  :value="option.option.trim()"
                  label-placement="end"
                  justify="start"
                  mode="md">
                  {{ option.option }}
                </ion-radio>
              </ion-item>
            </ion-radio-group>
          </ion-list>
        </ion-col>
      </ion-row>
    </ion-grid>

    <!-- Conditional components -->
    <multi-take-picture
      v-if="opt.field === 'multi-take-picture' && opt.condition"
      :id="`${id}-combo-box-condition`"
      :parent="parent"
      :label="label"
      :options="options"
      :key="myKey"
      :ref="(el) => (conditionalComponentRef[opt.field] = el)" />

    <multi-take-picture-remarks
      v-if="opt.field === 'multi-take-picture-remarks' && opt.condition"
      :id="`${id}-combo-box-condition`"
      :parent="parent"
      :label="label"
      :options="options"
      :key="myKey"
      :ref="(el) => (conditionalComponentRef[opt.field] = el)" />

    <take-picture
      v-if="opt.field === 'take-picture' && opt.condition"
      :id="`${id}-combo-box-condition`"
      :parent="parent"
      :label="label"
      :options="options"
      :key="myKey"
      :ref="(el) => (conditionalComponentRef[opt.field] = el)" />

    <remarks
      v-if="opt.field === 'remarks' && opt.condition"
      :id="`${id}-combo-box-condition`"
      :parent="parent"
      label="Remarks"
      :key="myKey"
      :ref="(el) => (conditionalComponentRef[opt.field] = el)" />

    <multi-remarks
      v-if="opt.field === 'multi-remarks' && opt.condition"
      :id="`${id}-combo-box-condition`"
      :parent="parent"
      :label="t('remarks')"
      :key="myKey"
      :ref="(el) => (conditionalComponentRef[opt.field] = el)" />

    <palletized-cargo
      v-if="opt.field === 'palletized-cargo' && opt.condition"
      :id="`${id}-combo-box-condition`"
      :parent="parent"
      label="Palletized Cargo"
      :key="myKey"
      :ref="(el) => (conditionalComponentRef[opt.field] = el)" />

    <product-description
      v-if="opt.field === 'product-description' && opt.condition"
      :id="`${id}-combo-box-condition`"
      :parent="parent"
      :label="label"
      :key="myKey"
      :ref="(el) => (conditionalComponentRef[opt.field] = el)" />

    <combo-box
      v-if="opt.field === 'combo-box' && opt.condition"
      :id="`${id}-combo-box-condition`"
      :parent="parent"
      :label="t('result')"
      :options="[t('passed'), t('failed'), t('pending'), 'N/A']"
      :key="myKey"
      :ref="(el) => (conditionalComponentRef[opt.field] = el)" />

    <form-input
      v-if="opt.field === 'input-text' && opt.condition"
      :id="`${id}-combo-box-condition`"
      :parent="parent"
      :label="t('remarks')"
      field="text"
      :key="myKey"
      :ref="(el) => (conditionalComponentRef[opt.field] = el)" />

    <form-input
      v-if="opt.field === 'input-number' && opt.condition"
      :id="`${id}-combo-box-condition`"
      :parent="parent"
      :label="t('remarks')"
      field="number"
      :key="myKey"
      :ref="(el) => (conditionalComponentRef[opt.field] = el)" />
  </div>
</template>

<style lang="css" scoped>
ion-list {
  border: 2px solid #dedede;
  border-radius: 4px;
}
</style>
