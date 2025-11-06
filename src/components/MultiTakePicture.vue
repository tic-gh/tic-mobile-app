<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import {
  IonGrid,
  IonRow,
  IonCol,
  IonInput,
  IonIcon,
  IonButton,
  IonActionSheet,
  IonLoading,
  IonToast,
} from '@ionic/vue';
import { ComponentProps, Picture } from '@/types';
import { useStorage } from '@/composables/useStorage';
import { useCamera } from '@/composables/useCamera';
import { useDebounce } from '@/composables/useDebounce';
import { CameraResultType } from '@capacitor/camera';
import { camera, removeCircle, add, close } from 'ionicons/icons';
import { useI18n } from 'vue-i18n';

const props = defineProps<ComponentProps>();
const { t } = useI18n();

const { storageGetJson, storageSetJson } = useStorage();
const { takePhoto, pickFromGallery, isLoading, error, hasError, clearError, checkAvailability } =
  useCamera();

// Use the debounce composable
const { debounce } = useDebounce(500);

const data = ref<Picture[]>([]);
const isActionSheetOpen = ref(false);

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

const openCamera = async (picture: Picture) => {
  try {
    const action = await showAction();

    if (action === 'take-picture') {
      await takePhotoOnly(picture);
    } else if (action === 'open-gallery') {
      await selectFromGallery(picture);
    } else if (action === 'N/A') {
      picture.value = 'N/A';
      await saveData();
    }
  } catch (err) {
    console.error('Error in openCamera:', err);
  }
};

const takePhotoOnly = async (picture: Picture) => {
  try {
    const image = await takePhoto(props.options.portrait, {
      quality: 90,
      resultType: CameraResultType.Uri,
    });

    if (image) {
      picture.value = image.webPath;
      await saveData();
    }
  } catch (err) {
    console.error('Error taking photo:', err);
  }
};

const selectFromGallery = async (picture: Picture) => {
  try {
    const image = await pickFromGallery({
      quality: 90,
      resultType: CameraResultType.Uri,
    });

    if (image) {
      picture.value = image.webPath;
      await saveData();
    }
  } catch (err) {
    console.error('Error selecting from gallery:', err);
  }
};

const removePicture = (picture: Picture) => {
  const index = data.value.findIndex((p) => p === picture);
  if (index > -1) {
    data.value.splice(index, 1);
    saveData();
  }
};

const addNewPicture = () => {
  const newPicture: Picture = {
    type: 'multi-take-picture',
    label: props.label ?? '',
    value: '',
  };
  data.value.push(newPicture);
  saveData();
};

// Initialize component
onMounted(async () => {
  // Initialize pictures array with stored data or default
  const storedData = await storageGetJson(props.id);
  if (storedData && Array.isArray(storedData)) {
    data.value = storedData;
  } else {
    // Initialize with one empty picture if no data exists
    data.value = [
      {
        type: 'multi-take-picture',
        label: props.label ?? '',
        value: '',
      },
    ];
  }

  // Check camera availability on mount
  await checkAvailability();
});

const isComplete = computed(() => {
  // Check if there are any pictures in the data array
  if (data.value.length === 0) {
    return false;
  }

  // Check if all pictures have either a value (image) or are marked as "N/A"
  return data.value.every((picture) => {
    const hasValue = picture.value && picture.value.trim() !== '';

    // If editable is enabled, also check for label
    if (props.options?.editable) {
      const hasLabel = picture.label && picture.label.trim() !== '';
      return hasValue && hasLabel;
    }

    return hasValue;
  });
});

defineExpose({
  isComplete,
});
</script>

<template>
  <ion-grid class="multi-take-picture ion-no-padding ion-margin-bottom">
    <ion-row>
      <ion-col>
        <section v-for="(picture, i) in data" :key="`${id}-${i}`" class="section">
          <div v-if="picture.value && picture.value !== 'N/A'">
            <ion-input
              v-if="options?.editable"
              type="text"
              v-model="picture.label"
              :placeholder="label"
              @ionChange="debouncedSaveData"
              style="border: 1px solid #ccc"
              class="custom-input">
            </ion-input>
            <div
              class="photo-thumbnail"
              v-if="picture.value"
              :style="{ 'background-image': 'url(' + picture.value + ')' }"
              @click="openCamera(picture)">
              <span class="input-label" v-if="!options?.editable">{{ label }}</span>
              <img v-if="picture.value !== 'N/A'" :src="picture.value" class="thumbnail" />
            </div>
          </div>
          <div v-if="picture.value === 'N/A'">
            <ion-input
              v-if="options?.editable"
              type="text"
              v-model="picture.label"
              :placeholder="label"
              @ionChange="debouncedSaveData"
              style="border: 1px solid #ccc"
              class="custom-input">
            </ion-input>
            <div class="image-title" @click="openCamera(picture)">
              <span class="input-label" v-if="!options?.editable">{{ label }}</span>
              <div class="take-photo">
                <ion-icon
                  v-if="picture.value === 'N/A'"
                  :icon="removeCircle"
                  class="danger-icon"></ion-icon>
              </div>
            </div>
          </div>
          <div v-if="!picture.value">
            <ion-input
              v-if="options?.editable"
              type="text"
              v-model="picture.label"
              :placeholder="label"
              @ionChange="debouncedSaveData"
              style="border: 1px solid #ccc"
              class="custom-input">
            </ion-input>
            <div class="image-title" @click="openCamera(picture)">
              <span class="input-label" v-if="!options?.editable">{{ label }}</span>
              <div class="take-photo">
                <ion-icon :icon="camera" class="camera-icon"></ion-icon>
              </div>
            </div>
          </div>
          <ion-button
            v-if="i > 0"
            fill="clear"
            @click="removePicture(picture)"
            style="float: right">
            <ion-icon :icon="close" slot="start"></ion-icon>
            {{ t('remove') }}
          </ion-button>
        </section>
        <ion-button fill="clear" @click="addNewPicture" style="float: left">
          <ion-icon :icon="add" slot="start"></ion-icon>
          {{ t('add_new_picture') }}
        </ion-button>
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

.section {
  margin-bottom: 50px;
}
.section:first-child {
  margin-bottom: 10px;
}
</style>
