<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useStorage } from '@/composables/useStorage';
import { useLoading } from '@/composables/useLoading';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonList,
  IonItem,
  IonInput,
  IonFooter,
  IonImg,
  toastController,
  alertController,
} from '@ionic/vue';
import { logOut, cloudDownload, arrowForward } from 'ionicons/icons';
import { download as downloadApi } from '@/api/download';
import { useInit } from '@/composables/useInit';

const router = useRouter();
const { t } = useI18n();
const { storageGetJson, storageSetJson, storageClear } = useStorage();
const { loadingShow, loadingHide } = useLoading();

// Reactive form data
const projectNumber = ref('');
const password = ref('');

// Other reactive data
const download = ref();
const versionNumber = ref(import.meta.env.VITE_APP_VER_NO);

useInit(async () => {
  download.value = await storageGetJson('download');
});

// Computed form validation
const isFormValid = computed(() => {
  return projectNumber.value !== '' && password.value !== '';
});

// Methods
const logoutPrompt = async () => {
  try {
    const confirm = await alertController.create({
      header: t('confirm_logout'),
      message: t('logout_message'),
      buttons: [
        {
          text: t('cancel'),
          role: 'cancel',
        },
        {
          text: t('logout'),
          handler: () => {
            logout();
          },
        },
      ],
    });
    await confirm.present();
  } catch (error) {
    console.error('Logout error:', error);
  }
};

const logout = async () => {
  await loadingShow({ message: `${t('logging_out')}...` });
  const remember = await storageGetJson('remember');
  // Clear stored data
  localStorage.removeItem('access_token');
  await storageClear();
  if (remember) {
    await storageSetJson('remember', remember);
  }
  await loadingHide();
  router.push('/login');
};

const confirmDownload = async () => {
  if (download.value) {
    const confirm = await alertController.create({
      header: t('active_inspection'),
      message: t('download_notice'),
      buttons: [
        {
          text: t('cancel'),
          role: 'cancel',
        },
        {
          text: t('proceed'),
          handler: () => {
            activeDownloadReport();
          },
        },
      ],
    });
    confirm.present();
  } else {
    await downloadReport();
  }
};

const activeDownloadReport = async () => {
  const token = localStorage.getItem('access_token');
  const user = await storageGetJson('user');
  const remember = await storageGetJson('remember');
  storageClear();
  if (token) {
    localStorage.setItem('access_token', token);
    storageSetJson('user', user);
  }
  if (remember) {
    storageSetJson('remember', remember);
  }
  await downloadReport();
};

const downloadReport = async () => {
  try {
    await loadingShow({ message: `${t('downloading_blank_report')}.. ${t('please_wait')}...` });

    if (!projectNumber.value || !password.value) {
      const toast = await toastController.create({
        message: t('error_details') || 'Please provide project number and password',
        duration: 3000,
        color: 'danger',
      });
      await toast.present();
      return;
    }

    // Store download data
    const downloadData = await downloadApi(projectNumber.value, password.value);
    downloadData.downloadTime = new Date().getTime();
    downloadData.startTime = undefined;
    await storageSetJson('download', downloadData);
    download.value = downloadData;
    await loadingHide();
    await proceedInspection();
  } catch (error) {
    await loadingHide();
    const toast = await toastController.create({
      message: t('error_server') || 'An error occurred during download',
      duration: 5000,
      color: 'danger',
    });
    await toast.present();
  }
};

const proceedInspection = async () => {
  if (
    download.value?.inspection?.template_id === 0 ||
    download.value?.inspection?.template_id === null
  ) {
    return router.push('/complex-home');
  } else {
    return router.push('/home');
  }
};
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="energize">
        <ion-title>{{ t('download') }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="logoutPrompt">
            {{ t('logout') }}
            <ion-icon slot="end" :icon="logOut"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="img-logo-container text-center">
        <ion-img class="img-logo" src="/images/logo.png" alt="TIC logo"> </ion-img>
      </div>
      <div class="download">
        <small class="orange-title">{{ t('download_dashboar_message') }}</small>

        <form @submit.prevent="confirmDownload">
          <ion-list>
            <ion-item class="ion-margin-bottom">
              <ion-input
                :label="t('report_number')"
                label-placement="floating"
                v-model="projectNumber">
              </ion-input>
            </ion-item>

            <ion-item class="ion-margin-bottom">
              <ion-input
                type="number"
                pattern="[0-9]*"
                inputmode="numeric"
                :label="t('password')"
                label-placement="floating"
                v-model="password">
              </ion-input>
            </ion-item>

            <ion-button
              type="submit"
              expand="block"
              size="large"
              color="energize"
              :disabled="!isFormValid">
              {{ t('download_button') }}
              <ion-icon slot="end" :icon="cloudDownload"></ion-icon>
            </ion-button>
          </ion-list>
        </form>

        <ion-button
          v-if="download"
          @click="proceedInspection"
          class="ion-margin-top"
          expand="block"
          size="large">
          {{ t('continue_inspection') }}
          <ion-icon slot="end" :icon="arrowForward"></ion-icon>
        </ion-button>
      </div>
    </ion-content>

    <ion-footer class="ion-no-border">
      <ion-toolbar>
        <div class="version">
          <small>App Version: {{ versionNumber }}</small>
        </div>
      </ion-toolbar>
    </ion-footer>
  </ion-page>
</template>

<style lang="css" scoped>
.img-logo-container {
  margin: 100px auto 20px auto;
}

.img-logo {
  max-width: 100%;
  margin: 30px auto;
}

.orange-title {
  color: #f8852e;
  font-weight: bold;
  text-align: center;
}

.version {
  text-align: center;
  padding: 5px 0;
}

.text-center {
  text-align: center;
}

.download {
  padding: 20px 0;
}
</style>
