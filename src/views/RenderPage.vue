<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonTitle,
  IonContent,
  IonFooter,
  alertController
} from '@ionic/vue';
import { useInit } from '@/composables/useInit';
import { useStorage } from '@/composables/useStorage';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { arrowBack } from 'ionicons/icons';
import GenInfo from '@/components/GenInfo.vue';
import TakePicture from '@/components/TakePicture.vue';
import TakePictureGallery from '@/components/TakePictureGallery.vue';
import FormInput from '@/components/FormInput.vue';
import MultiTakePicture from '@/components/MultiTakePicture.vue';
import MultiTakePictureRemarks from '@/components/MultiTakePictureRemarks.vue';
import Remarks from '@/components/RemarksComponent.vue';
import MultiRemarks from '@/components/MultiRemarks.vue';
import PalletizedCargo from '@/components/PalletizedCargo.vue';
import ProductDescription from '@/components/ProductDescription.vue';
import ComboBox from '@/components/ComboBox.vue';
import ComboBoxCondition from '@/components/ComboBoxCondition.vue';
import DateTimeInput from '@/components/DateTimeInput.vue';
import ProductInput from '@/components/ProductInput.vue';
import ShowImage from '@/components/ShowImage.vue';
import CheckboxRadio from '@/components/CheckboxRadio.vue';
import TotalNumber from '@/components/TotalNumber.vue';
import CustomTable from '@/components/CustomTable.vue';
import { sendInspectionStatus } from '@/api/report';

// Component mapping for dynamic rendering
const componentMap = {
  'gen-info': GenInfo,
  'take-picture-gallery': TakePictureGallery,
  'form-input': FormInput,
  'combo-box-condition': ComboBoxCondition,
  'take-picture': TakePicture,
  'multi-take-picture': MultiTakePicture,
  'multi-take-picture-remarks': MultiTakePictureRemarks,
  'remarks': Remarks,
  'multi-remarks': MultiRemarks,
  'palletized-cargo': PalletizedCargo,
  'product-description': ProductDescription,
  'combo-box': ComboBox,
  'date-time-input': DateTimeInput,
  'product-input': ProductInput,
  'show-image': ShowImage,
  'checkbox-radio': CheckboxRadio,
  'total-number': TotalNumber,
  'custom-table': CustomTable,
};

const { storageGetJson, storageSetJson } = useStorage();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const versionNumber = ref(import.meta.env.VITE_APP_VER_NO);
const key = ref(route.params.key);
const items = ref();
const item = ref();
const components = ref();
const download = ref();
const componentRef = ref<any>({});
const scrollToTop = ref(false);
const contentRef = ref<any>(null);

useInit(async () => {
  scrollToTop.value = true;
  items.value = await storageGetJson('items');
  download.value = await storageGetJson('download');
  item.value = items.value.find((item: any) => item.key === key.value);
  components.value = item.value.data.items;
});

const getBind = (component: any) => {
  return {
    parent: item.value.key,
    id: component.key,
    ...component,
  };
};

const doneSection = async () => {
  // Navigate back to the list view
  if (incompleteComponents.value.length > 0) {
    const firstIncomplete = incompleteComponents.value[0];
    const label = firstIncomplete?.label || firstIncomplete?.title || 'Field';
    
    const alert = await alertController.create({
      header: 'Unanswered Field',
      message: label + ' was left unanswered.',
      buttons: [
        {
          text: 'Ok',
          handler: () => {
            // Scroll to the incomplete component after the alert is dismissed
            setTimeout(async () => {
              await scrollToComponent(incompleteComponents.value[0].key);
            }, 300);
          }
        }
      ]
    });
    
    await alert.present();
    return;
  }

  router.push('/list');
};

const incompleteComponents = computed(() => {
  if (!components.value || components.value.length === 0) {
    return [];
  }

  return components.value.filter((component: any) => {
    const componentInstance = componentRef.value[component.key];
    return (
      !componentInstance ||
      typeof componentInstance.isComplete === 'undefined' ||
      !componentInstance.isComplete
    );
  });
});

const scrollToComponent = async (componentKey: string) => {
  const element = document.querySelector(`[data-component-key="${componentKey}"]`) as HTMLElement;
  if (element && contentRef.value) {
    try {
      await contentRef.value.$el.scrollToPoint(0, element.offsetTop - 100, 500);
    } catch (error) {
      // Fallback to native scrollIntoView if Ionic method fails
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }
};

onBeforeUnmount( async () => {
  item.value.inspection_status = false;  
  if (incompleteComponents.value.length === 0) {
    item.value.inspection_status = true;
    // Only send inspection status once per section
    if (!item.value.inspection_status_sent) {
      if (
        download.value &&
        download.value.report &&
        download.value.report.report_no &&
        item.value.title
      ) {
        try {
          sendInspectionStatus(download.value.report.report_no, item.value.title);
          item.value.inspection_status_sent = true;
        } catch (e) {
          console.log(e);
        }
      }
    }
  }

  await storageSetJson('items', items.value);
})
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="energize">
        <ion-buttons slot="start">
          <ion-button @click="router.push('/list')">
            <ion-icon slot="icon-only" :icon="arrowBack"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title v-if="item?.title === 'Additional Information'">{{ t('add_info') }}</ion-title>
        <ion-title v-else-if="item?.title === 'Additional Header Information'">{{
          t('add_header_info')
        }}</ion-title>
        <ion-title v-else-if="item?.title === 'Additional Footer Information'">{{
          t('add_footer_info')
        }}</ion-title>
        <ion-title v-else>{{ item?.title }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content ref="contentRef" class="ion-padding" v-if="scrollToTop">
      <template v-for="component in components" :key="component.key">
        <div :data-component-key="component.key">
          <component
            :is="componentMap[component.component as keyof typeof componentMap]"
            v-bind="getBind(component)"
            :download="download"
            :ref="(el: any) => (componentRef[component.key] = el)" />
        </div>
      </template>

      <ion-button
        expand="block"
        color="energize"
        class="ion-text-center"
        size="large"
        @click="doneSection()"
        style="margin-top: 16px; margin-bottom: 16px">
        {{ t('done') }}
      </ion-button>
    </ion-content>
    <ion-footer class="ion-no-border">
      <div class="version">
        <small>App Version: {{ versionNumber }}</small>
      </div>
    </ion-footer>
  </ion-page>
</template>

<style lang="css" scoped>
.version {
  margin-bottom: var(--ion-safe-area-bottom, 0);
  text-align: center;
  padding: 5px 0;
}

.incomplete-list {
  margin: 16px 0;
  padding: 12px;
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
}

.incomplete-list h3 {
  margin: 0 0 8px 0;
  color: #856404;
  font-size: 16px;
  font-weight: 600;
}

.incomplete-list ul {
  margin: 0;
  padding-left: 20px;
}

.incomplete-list li {
  color: #856404;
  margin-bottom: 4px;
}

.clickable-item {
  cursor: pointer;
  transition: all 0.2s ease;
}

.clickable-item:hover {
  color: #5a4a00;
  text-decoration: underline;
  transform: translateX(4px);
}
</style>
