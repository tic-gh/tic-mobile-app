<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useStorage } from '@/composables/useStorage';
import { useInit } from '@/composables/useInit';
import { useLocation } from '@/composables/useLocation';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonMenuButton,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonFooter,
  IonProgressBar,
  toastController,
} from '@ionic/vue';
import { checkmarkCircle, cloudUpload } from 'ionicons/icons';
import { checkFilesAlreadyUploaded, uploadImage, uploadImagesAsZip, sendAnswers, sendEmail } from '@/api/report';
import { Geolocation } from '@capacitor/geolocation';
import { useGeofence } from '@/composables/useGeofence';

// Type definitions
interface InspectionItem {
  id?: string | number;
  title: string;
  inspection_status?: boolean;
  data?: any;
  key?: string;
}

const router = useRouter();
const { t } = useI18n();
const { storageGetJson, storageSetJson, storageGet } = useStorage();
const { getGeoLocation } = useLocation();
const { removeAllGeofence } = useGeofence();

// Reactive data
const user = ref();
const items = ref<InspectionItem[]>([]);
const loadProgress = ref(0);
const status = ref('');
const sendingReport = ref(false);
const sendBtnString = ref(t('send_report'));
const versionNumber = ref(import.meta.env.VITE_APP_VER_NO);

// Additional reactive data for the enhanced send report functionality
const download = ref<any>(null);
const images = ref<any[]>([]);
const data = ref<any[]>([]);
const retry = ref(0);
const curSectionTitle = ref<string>('');

// Configuration: Set to true to use zip upload, false to use individual uploads
// To switch between methods, change this value:
// - true: Uses zipUpload() - faster, single zip file upload
// - false: Uses multiUpload() - original method, individual file uploads
const useZipUpload = ref(true);

useInit(async () => {
  user.value = await storageGetJson('user');
  items.value = (await storageGetJson('items')) ?? [];
  download.value = await storageGetJson('download');

  if (items.value.length === 0) {
    items.value = download.value.items;
    await storageSetJson('items', items.value);
  }
});

const complete = computed(() =>
  items.value.every((item: InspectionItem) => item.inspection_status)
);

const itemTapped = (item: InspectionItem) => {
  return router.push({
    name: 'renderPage',
    params: {
      key: item.key,
    },
  });
};



const sendReport = async () => {
  sendBtnString.value = t('uploading_report');
  sendingReport.value = true;
  status.value = t('status_prepare');

  try {
    prepareData();
    await timeout(10);
    if (images.value.length > 0) {
      status.value = t('status_uploading');
      await checkForFilesAlreadyUploaded();
    } else {
      await sendAnswerAndEmail();
    }
  } catch (error) {
    console.error('Error in sendReportRedone:', error);
    status.value = t('error_sending_report');
  } finally {
    sendBtnString.value = t('send_report');
  }
};

// Helper function to simulate timeout with progress
const timeout = (num: number): Promise<any> => {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      if (loadProgress.value > num) {
        clearInterval(interval);
        resolve(true);
      } else {
        loadProgress.value += 1;
      }
    }, 100);
  });
};

// Prepare data from localStorage
const prepareData = async () => {
  try {
    const items = (await storageGetJson('items')) ?? [];
    images.value = [];

    for (const item of items) {
      const itemData = [];

      for (const subItem of item.data.items) {
        if (['form-input', 'combo-box', 'date-time-input'].includes(subItem.component)) {
          // Components that use storageSet (simple string values)
          const subItemData = await storageGet(subItem.key);
          if (subItemData) {
            itemData.push({
              [subItem.key]: subItemData,
            });
          }
        } else {
          // Components that use storageSetJson (complex objects)
          const subItemData = await storageGetJson(subItem.key);

          if (subItemData) {
            // if subItemData is a custom-table it needs to be parse here

            if (subItem.component === 'custom-table') {
              // Handle custom-table data - subItemData should be an array of objects
              if (Array.isArray(subItemData)) {
                for (let i = 0; i < subItemData.length; i++) {
                  const customTableItem = subItemData[i];
                  if (customTableItem) {
                    for (const component of customTableItem) {
                      if (
                        ['form-input', 'combo-box', 'date-time-input'].includes(component.component)
                      ) {
                        const subComponentData = await storageGet(component.key + i);
                        if (subComponentData) {
                          itemData.push({
                            [component.key + i]: subComponentData,
                          });
                        }
                      } else {
                        const subComponentData = await storageGetJson(component.key + i);
                        if (subComponentData) {
                          itemData.push({
                            [component.key + i]: subComponentData,
                          });
                        }

                        if (component.component === 'combo-box-condition') {
                          const comboBoxConditionData = subComponentData.options?.filter(
                            (option: any) => option.option === subComponentData.value
                          );
                          if (comboBoxConditionData && comboBoxConditionData.length > 0) {
                            const selectedOption = comboBoxConditionData[0];

                            if (
                              ['form-input', 'combo-box', 'date-time-input'].includes(
                                selectedOption.field
                              )
                            ) {
                              const subSubItemData = await storageGet(
                                component.key + '-combo-box-condition'
                              );
                              if (subSubItemData) {
                                itemData.push({
                                  [component.key + '-combo-box-condition']: subSubItemData,
                                });
                              }
                            } else {
                              const subSubItemData = await storageGetJson(
                                component.key + '-combo-box-condition'
                              );
                              if (subSubItemData) {
                                itemData.push({
                                  [component.key + '-combo-box-condition']: subSubItemData,
                                });
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            } else {
              itemData.push({
                [subItem.key]: subItemData,
              });
            }

            // if subItemData has additional component add its data here
            if (subItem.component === 'combo-box-condition') {
              const comboBoxConditionData = subItemData.options?.filter(
                (option: any) => option.option === subItemData.value
              );

              if (comboBoxConditionData && comboBoxConditionData.length > 0) {
                const selectedOption = comboBoxConditionData[0];

                if (['form-input', 'combo-box', 'date-time-input'].includes(selectedOption.field)) {
                  const subSubItemData = await storageGet(subItem.key + '-combo-box-condition');
                  if (subSubItemData) {
                    itemData.push({
                      [subItem.key + '-combo-box-condition']: subSubItemData,
                    });
                  }
                } else {
                  const subSubItemData = await storageGetJson(subItem.key + '-combo-box-condition');
                  if (subSubItemData) {
                    itemData.push({
                      [subItem.key + '-combo-box-condition']: subSubItemData,
                    });
                  }
                }
              }
            }
          }
        }
      }

      curSectionTitle.value = item.title;
      data.value.push({
        key: item.key,
        title: item.title,
        data: itemData,
      });
      checkImageLinks(itemData);
    }
  } catch (error) {
    console.error('Error preparing data:', error);
  }
};

// Check for image links in answer data
const checkImageLinks = (answer: any) => {
  try {
    const values = Object.values(answer);

    for (const value of values) {
      if (value && typeof value === 'object') {
        checkImageLinks(value);
      } else if (
        typeof value === 'string' &&
        (/^(http|https):\/\/.+\.([jJ][pP][gG]|[jJ][pP][eE][gG])$/.test(value) ||
         /^capacitor:\/\/localhost\/.+\.([jJ][pP][gG]|[jJ][pP][eE][gG])$/.test(value))
      ) {
        let imageUrl = value;
        // Only convert if it's a localhost/_capacitor_file_ URL (Android)
        if (/^(http|https):\/\/(localhost|[\d.]+)(:\d+)?\/_capacitor_file_\//.test(value)) {
          imageUrl = value.replace(
            /^(http|https):\/\/(localhost|[\d.]+)(:\d+)?\/_capacitor_file_\//,
            'file:///'
          );
        }
        // For capacitor://localhost/ (iOS), leave as is
        images.value.push({
          image: imageUrl,
          section: curSectionTitle.value,
          label: answer.label || '',
        });
      }
    }
  } catch (error) {
    console.error('Error checking image links:', error);
  }
};

// Check which files are already uploaded
const checkForFilesAlreadyUploaded = async () => {
  try {
    const imagesToUpload: any[] = [];

    // Simulate checking uploaded files
    const list = await checkFilesAlreadyUploaded(download.value.report.report_no);

    for (const uri of images.value) {
      const fileName = uri.image?.split('\\').pop()?.split('/').pop();
      if (!list.includes(fileName)) {
        imagesToUpload.push(uri);
      }
    }
    
    // Choose upload method based on configuration
    if (useZipUpload.value) {
      await zipUpload(imagesToUpload);
    } else {
      await multiUpload(imagesToUpload);
    }
  } catch (error) {
    console.error('Error checking files:', error);
  }
};

// NEW: Upload images as zip (faster, single file upload)
const zipUpload = async (imagesToUpload: any[], msg: string | null = null) => {
  try {
    if (imagesToUpload.length === 0) {
      await sendAnswerAndEmail();
      return;
    }

    // Update progress to show zip creation
    status.value = (msg ? msg + ' ' : '') + t('status_creating_zip') || 'Creating zip archive...';
    await timeout(20);

    // Update progress to show zip upload
    status.value = (msg ? msg + ' ' : '') + t('status_uploading_zip') || 'Uploading zip archive...';
    await timeout(50);

    // Upload all images as a single zip file
    const uploadResult = await uploadImagesAsZip(download.value.report.report_no, imagesToUpload);
    
    if (uploadResult && uploadResult.success !== false) {
      // Update progress to show completion
      await timeout(75);
      await sendAnswerAndEmail();
    } else {
      throw new Error(uploadResult?.message || 'Failed to upload zip file');
    }
  } catch (error: any) {
    console.error('Error uploading zip:', error);
    
    if (retry.value > 0) {
      console.error('Max retries exceeded');
      status.value = t('error_sending_report');
    } else {
      retry.value++;
      await zipUpload(
        imagesToUpload,
        'Zip upload failed. Retrying ' + retry.value + '...'
      );
    }
  }
};

// ORIGINAL: Upload multiple images individually (original function)
const multiUpload = async (imagesToUpload: any[], msg: string | null = null) => {
  const promisesArray: Promise<any>[] = [];
  const filesToUpload: any[] = imagesToUpload;
  const failedUpload: any[] = [];
  let index = 1;
  let cnt = 1;
  let fileErr = false;

  for (const uri of filesToUpload) {
    const tick = Math.floor((index / imagesToUpload.length) * 75) + 10;
    await timeout(tick);
    status.value =
      (msg ? msg + ' ' : '') + t('status_uploading') + ' ' + cnt + '/' + imagesToUpload.length;

    // Upload image using the uploadImage function
    const uploadPromise = uploadImage(download.value.report.report_no, uri);
    promisesArray.push(
      uploadPromise.catch((err) => {
        if (err.code === 1) {
          console.error('File error:', uri);
          fileErr = true;
        } else {
          failedUpload.push(uri);
          index--;
        }
      })
    );

    index++;
    cnt++;
    if (fileErr) break;
  }

  await Promise.all(promisesArray);

  if (failedUpload.length > 0) {
    if (retry.value > 0) {
      console.error('Max retries exceeded');
      status.value = t('error_sending_report');
    } else {
      retry.value++;
      await multiUpload(
        failedUpload,
        failedUpload.length + ' files failed to upload.. Retrying ' + retry.value
      );
    }
  } else {
    if (!fileErr) {
      await sendAnswerAndEmail();
    }
  }
};

// Send answers and email
const sendAnswerAndEmail = async () => {
  try {
    status.value = t('status_submitting');
    // Simulate progress before sending answers
    await timeout(90);
    const dataPayload = formatDataPayload(data.value);
    // Send answers to backend
    const answersRes = await sendAnswers(download.value?.report?.id, dataPayload, download.value?.downloadTime);

    if (answersRes && answersRes.success !== false) {
      status.value = t('sending_email');
      // Simulate progress before sending email
      await timeout(95);
      // Send email after answers
      const emailRes = await sendEmail(download.value?.report?.report_no, download.value?.inspection?.inspector_id);

      if (emailRes && emailRes.success !== false) {
        status.value = t('sending_geolocation');
        // Simulate progress before sending geolocation
        await timeout(100);
        // Send geolocation after email
        try {
          // Check if location is enabled (using Capacitor Geolocation)
          const permission = await Geolocation.checkPermissions();
          if (permission.location === 'denied') {
            throw new Error('Error getting current position please allow location permission!');
          }

          // Get current position
          const position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 300000,
          });

          await getGeoLocation(position);

          await removeAllGeofence();
        } catch (geoErr) {
          console.warn('Geolocation failed:', geoErr);
        }
        // Report sent successfully
        status.value = t('upload_done');
        sendingReport.value = false;
        // Show success toast
        const toast = await toastController.create({
          message: t('upload_done') || 'Report uploaded successfully!',
          duration: 5000,
          color: 'success'
        });
        await toast.present();
      } else {
        throw new Error(emailRes?.message || 'Failed to send email');
      }
    } else {
      throw new Error(answersRes?.message || 'Failed to send answers');
    }
  } catch (error: any) {
    console.error('Error sending answers and email:', error);
    status.value = t('error_sending_report') + (error?.message ? ': ' + error.message : '');
    sendingReport.value = false;
    // Show error toast
    const toast = await toastController.create({
      message: t('error_sending_report') + (error?.message ? ': ' + error.message : ''),
      duration: 5000,
      color: 'danger'
    });
    await toast.present();
  }
};

// Helper function to recursively format URLs in the data payload
const formatDataPayload = (payload: any): any => {
  if (Array.isArray(payload)) {
    return payload.map(formatDataPayload);
  } else if (payload && typeof payload === 'object') {
    const formatted: any = {};
    for (const key in payload) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        formatted[key] = formatDataPayload(payload[key]);
      }
    }
    return formatted;
  } else if (typeof payload === 'string') {
    // Replace Android and iOS local URLs with http://localhost:8080
    return payload
      .replace(/(http|https):\/\/(localhost|[\d.]+)(:\d+)?/g, 'http://localhost:8080')
      .replace(/^capacitor:\/\/localhost/g, 'http://localhost:8080');
  }

  return payload;
}
</script>

<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-menu-button menu="main-menu"></ion-menu-button>
      </ion-buttons>
      <ion-title>{{ t('inspection_list') }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content class="ion-padding">
    <ion-list>
      <ion-item
        v-for="item in items"
        :key="item.id || item.title"
        button
        @click="itemTapped(item)">
        <div v-if="item.title === 'Additional Information'">
          {{ t('add_info') }}
        </div>
        <div v-else-if="item.title === 'Additional Header Information'">
          {{ t('add_header_info') }}
        </div>
        <div v-else-if="item.title === 'Additional Footer Information'">
          {{ t('add_footer_info') }}
        </div>
        <div v-else>
          {{ item.title }}
        </div>
        <ion-icon
          v-if="item.inspection_status"
          :icon="checkmarkCircle"
          color="success"
          slot="end">
        </ion-icon>
      </ion-item>
    </ion-list>

    <ion-progress-bar
      v-if="sendingReport"
      :value="loadProgress / 100"
      :color="loadProgress >= 100 ? 'success' : 'primary'">
    </ion-progress-bar>

    <div v-if="sendingReport" class="ion-text-center ion-margin-top">
      <small>{{ status }}</small>
    </div>

    <ion-button
      expand="block"
      color="energize"
      size="large"
      class="ion-margin-top"
      :disabled="!complete || sendingReport"
      @click="sendReport">
      {{ sendBtnString }}
      <ion-icon :icon="cloudUpload" slot="end"></ion-icon>
    </ion-button>
  </ion-content>

  <ion-footer class="ion-no-border">
    <div class="version">
      <small>App Version: {{ versionNumber }}</small>
    </div>
  </ion-footer>
</template>

<style lang="css" scoped>
.title-md {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 100%;
  text-align: center;
}
.back-button {
  z-index: 5;
}
.button.button-energized {
  border-color: transparent;
  background-color: #ffc900;
  color: #fff;
}
.item {
  font-size: 1rem;
  min-height: 3rem;
}
.item-block:first-child {
  border-top: 1px solid #dedede;
}
.item-block:last-child {
  border-bottom: 1px solid #dedede;
}
.item {
  padding-left: 0;
}
.item-icon {
  zoom: 2;
}
.version {
  margin-bottom: var(--ion-safe-area-bottom, 0);
  text-align: center;
  padding: 5px 0;
}
</style>
