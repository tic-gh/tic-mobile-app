<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import {
  IonGrid,
  IonRow,
  IonCol,
  IonInput,
  IonImg,
  IonIcon,
  IonLoading,
  IonToast,
  IonActionSheet,
} from '@ionic/vue';
import { useStorage } from '@/composables/useStorage';
import { useCamera } from '@/composables/useCamera';
import { useDebounce } from '@/composables/useDebounce';
import { CameraResultType } from '@capacitor/camera';
import { camera, removeCircle, images } from 'ionicons/icons';
import { ComponentProps, Picture } from '@/types';
import { useI18n } from 'vue-i18n';

const props = defineProps<ComponentProps>();
const { t } = useI18n();

const data = ref<Picture>({
  type: 'take-picture',
  label: props.label ?? '',
  value: '',
});

const isActionSheetOpen = ref(false);

const { storageSetJson, storageGetJson } = useStorage();
const { takePhoto, pickFromGallery, isLoading, error, hasError, clearError, checkAvailability } =
  useCamera();

// Use the debounce composable
const { debounce } = useDebounce(500);

const saveData = async () => {
  await storageSetJson(props.id, data.value);
};

const debouncedSaveData = debounce(saveData);

const showAction = async (): Promise<string> => {
  return new Promise((resolve) => {
    isActionSheetOpen.value = true;

    // Store the resolve function to use in template handlers
    (window as any).__actionSheetResolve = resolve;
  });
};

const handleActionSheetAction = (action: string) => {
  isActionSheetOpen.value = false;
  const resolve = (window as any).__actionSheetResolve;
  if (resolve) {
    resolve(action);
    delete (window as any).__actionSheetResolve;
  }
};

const openCamera = async () => {
  try {
    const action = await showAction();

    if (action === 'take-picture') {
      await takePhotoOnly();
    } else if (action === 'open-gallery') {
      await selectFromGallery();
    } else if (action === 'N/A') {
      data.value.value = 'N/A';
      await saveData();
    }
  } catch (err) {
    console.error('Error in openCamera:', err);
  }
};

const takePhotoOnly = async () => {
  try {
    const image = await takePhoto(props.options.portrait, {
      quality: 90,
      resultType: CameraResultType.Uri,
    });

    if (image) {
      data.value.value = image.webPath;
      await saveData();
    }
  } catch (err) {
    console.error('Error taking photo:', err);
  }
};

const selectFromGallery = async () => {
  try {
    const image = await pickFromGallery({
      quality: 90,
      resultType: CameraResultType.Uri,
    });

    if (image) {
      data.value.value = image.webPath;
      await saveData();
    }
  } catch (err) {
    console.error('Error selecting from gallery:', err);
  }
};

// Initialize component
onMounted(async () => {
  // Initialize picture with props values
  const storedData = await storageGetJson(props.id);
  if (storedData) {
    data.value = storedData;
  }

  // Check camera availability on mount
  await checkAvailability();
});

const isComplete = computed(() => {
  const hasValue = !!data.value.value;
  const hasLabel = !props.options?.editable || !!data.value.label;

  return hasValue && hasLabel;
});

defineExpose({
  isComplete,
});
</script>

<template>
  <ion-grid class="take-picture-gallery ion-no-padding ion-margin-bottom">
    <ion-row>
      <ion-col>
        <div v-if="data.value && data.value !== 'N/A'">
          <ion-input
            v-if="options?.editable"
            type="text"
            v-model="data.label"
            :placeholder="label"
            @ionChange="debouncedSaveData()"
            autocomplete="on"
            autocorrect="on"
            autocapitalize="on"
            :spellcheck="true"
            class="custom-input">
          </ion-input>
          <div
            v-if="data.value"
            class="photo-thumbnail"
            :style="{ 'background-image': 'url(' + data.value + ')' }"
            @click="openCamera()">
            <div v-if="!options?.editable" class="input-label">{{ label }}</div>
            <ion-img v-if="data.value !== 'N/A'" :src="data.value" class="thumbnail" />
          </div>
        </div>
        <div v-if="data.value === 'N/A'">
          <ion-input
            v-if="options?.editable"
            type="text"
            v-model="data.label"
            :placeholder="label"
            @ionChange="debouncedSaveData()"
            autocomplete="on"
            autocorrect="on"
            autocapitalize="on"
            :spellcheck="true"
            class="custom-input">
          </ion-input>
          <div class="image-title" @click="openCamera">
            <div v-if="!props.options?.editable" class="input-label">{{ props.label }}</div>
            <div class="take-photo">
              <ion-icon
                v-if="data.value === 'N/A'"
                :icon="removeCircle"
                class="danger-icon"></ion-icon>
            </div>
          </div>
        </div>
        <div v-if="!data.value">
          <ion-input
            v-if="options?.editable"
            type="text"
            v-model="data.label"
            :placeholder="props.label"
            @ionChange="debouncedSaveData()"
            autocomplete="on"
            autocorrect="on"
            autocapitalize="on"
            :spellcheck="true"
            class="custom-input">
          </ion-input>
          <div class="image-title" @click="openCamera">
            <div v-if="!props.options?.editable" class="input-label">{{ props.label }}</div>
            <div class="take-photo">
              <ion-icon :icon="camera" class="camera-icon"></ion-icon>
            </div>
          </div>
        </div>

        <!-- Loading indicator -->
        <ion-loading :is-open="isLoading" :message="t('processing_image')" :duration="0">
        </ion-loading>

        <!-- Error toast -->
        <ion-toast
          :is-open="hasError"
          :message="error?.message || t('an_error_occurred')"
          :duration="3000"
          position="top"
          color="danger"
          @ionToastDidDismiss="clearError">
        </ion-toast>

        <!-- Action Sheet -->
        <ion-action-sheet
          :is-open="isActionSheetOpen"
          :header="t('select_action')"
          :buttons="[
            {
              text: t('take_picture'),
              icon: camera,
              handler: () => handleActionSheetAction('take-picture'),
            },
            {
              text: t('open_gallery'),
              icon: images,
              handler: () => handleActionSheetAction('open-gallery'),
            },
            {
              text: t('not_applicable'),
              icon: removeCircle,
              handler: () => handleActionSheetAction('N/A'),
            },
            {
              text: t('cancel'),
              role: 'cancel',
              handler: () => handleActionSheetAction('cancel'),
            },
          ]"
          @ionActionSheetDidDismiss="isActionSheetOpen = false">
        </ion-action-sheet>
      </ion-col>
    </ion-row>
  </ion-grid>
</template>

<style lang="css" scoped>
.take-photo {
  text-align: center;
  height: 250px;
  background-color: #bdbdbd;
  display: flex;
  align-items: center;
  justify-content: center;
}

.camera-icon {
  margin-top: 20px;
  font-size: 2.5rem;
  background-color: #bdbdbd;
  color: var(--ion-color-medium);
}

.danger-icon {
  margin-top: 20px;
  font-size: 2.5rem;
  background-color: #bdbdbd;
  color: var(--ion-color-danger);
}

.photo-thumbnail {
  position: relative;
  max-height: 250px;
  overflow: hidden;
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
  border-radius: 8px;
  margin: 0.5rem 0;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.photo-thumbnail .thumbnail {
  width: 100%;
  height: auto;
  display: block;
}

.image-title {
  position: relative;
}

.input-label {
  background-color: rgba(0, 0, 0, 0.5);
  color: var(--ion-color-light);
  position: absolute;
  width: 100%;
  padding: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  z-index: 1;
  border-radius: 4px 4px 0 0;
}

.custom-input {
  --background: #efefef;
  --border-style: solid;
  --border-width: 1px;
  --border-color: var(--ion-color-medium);
  --padding-start: 1rem;
  --padding-end: 1rem;
  --padding-top: 0.75rem;
  --padding-bottom: 0.75rem;
}
</style>
