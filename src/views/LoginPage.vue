<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useStorage } from '@/composables/useStorage';
import { useLoading } from '@/composables/useLoading';
import { login as loginApi, getUser } from '@/api/auth';
import {
  IonToolbar,
  IonContent,
  IonList,
  IonItem,
  IonInput,
  IonToggle,
  IonButton,
  IonIcon,
  IonFooter,
  IonImg,
  IonPage,
  actionSheetController,
  toastController,
} from '@ionic/vue';
import { send } from 'ionicons/icons';
import { useRouter } from 'vue-router';
import { useInit } from '@/composables/useInit';
import { BackgroundRunner } from '@capacitor/background-runner';
import { Capacitor } from '@capacitor/core';

const router = useRouter();
const { t, locale } = useI18n({ useScope: 'global' });
const { storageGet, storageGetJson, storageSet, storageSetJson, storageRemove } = useStorage();
const { loadingShow, loadingHide } = useLoading();

// Reactive form data
const username = ref('');
const password = ref('');
const remember = ref(false);

// Other reactive data
const download = ref();
const versionNumber = ref(import.meta.env.VITE_APP_VER_NO);

useInit(async () => {
  const selectedLang = await storageGet('lang');
  if (selectedLang) {
    locale.value = selectedLang;
  }
  const rememberMe = await storageGetJson('remember');
  if (rememberMe) {
    username.value = rememberMe.username;
    password.value = rememberMe.password;
    remember.value = rememberMe.remember;
  }
  download.value = await storageGetJson('download');
});

// Computed flag based on current locale
const flag = computed(() => {
  return `/images/${locale.value}.png`;
});

// Methods
const presentLanguageSelect = async () => {
  const actionSheet = await actionSheetController.create({
    header: t('choose_language'),
    buttons: [
      {
        text: 'English',
        handler: async () => {
          locale.value = 'en';
          await storageSet('lang', 'en');
        },
      },
      {
        text: 'Turkish',
        handler: async () => {
          locale.value = 'tr';
          await storageSet('lang', 'tr');
        },
      },
      {
        text: 'Spanish',
        handler: async () => {
          locale.value = 'es';
          await storageSet('lang', 'es');
        },
      },
      {
        text: 'Cancel',
        role: 'cancel',
      },
    ],
  });

  await actionSheet.present();
};

const login = async () => {
  try {
    const backgroundPermission = await hasBackgroundPermission();
    if (backgroundPermission == false) {
      const toast = await toastController.create({
        message: t('location_always_on') || 'Please set location permission to allow all the time',
        duration: 5000,
        color: 'danger',
      });
      await toast.present();
      return;
    }

    const notificationPermission = await hasNotificationPermission();
    if (notificationPermission == false) {
      const toast = await toastController.create({
        message: t('notification_permission') || 'Please set notification permission to allow notifications',
        duration: 5000,
        color: 'danger',
      });
      await toast.present();
      return;
    }

    await loadingShow({ message: `${t('login_message')}.. ${t('please_wait')}...` });

    if (!username.value || !password.value) {
      const toast = await toastController.create({
        message: t('username_password_required') || 'Username and password are required',
        duration: 3000,
        color: 'danger',
      });
      await toast.present();
      return;
    }

    // Call the login API
    const response = await loginApi({
      username: username.value,
      password: password.value,
      version: versionNumber.value,
    });

    if (response.success && response.token) {
      // Store the auth token for future requests using utility function
      localStorage.setItem('access_token', `Bearer ${response.token}`);

      // Fetch user information
      const user = await getUser();
      await storageSetJson('user', user);

      if (remember.value) {
        // Store remember me preference
        await storageSetJson('remember', {
          username: username.value,
          password: password.value,
          remember: true,
        });
      } else {
        username.value = '';
        password.value = '';
        await storageRemove('remember');
      }
      await loadingHide();
      // Navigate to main app or proceed with inspection
      return router.push('/download');
    } else {
      // Show error message
      if (!remember.value) {
        username.value = '';
        password.value = '';
      }
      const toast = await toastController.create({
        message: t(response.message!) || t('login_failed') || 'Login failed',
        duration: 5000,
        color: 'danger',
      });
      await loadingHide();
      await toast.present();
    }
  } catch (error) {
    if (!remember.value) {
      username.value = '';
      password.value = '';
    }
    const toast = await toastController.create({
      message: t('login_error') || 'An error occurred during login',
      duration: 5000,
      color: 'danger',
    });
    await loadingHide();
    await toast.present();
  }
};

const isFormValid = () => {
  return username.value !== '' && password.value !== '';
};

const hasBackgroundPermission = async () => {
  if (!Capacitor.isNativePlatform()) {
    return true; // Skip permission check on web
  }
  
  const permission = await BackgroundRunner.checkPermissions() as any;

  return permission.backgroundGeolocation === 'granted'
}

const hasNotificationPermission = async () => {
  if (!Capacitor.isNativePlatform()) {
    return true; // Skip permission check on web
  }
  
  const permission = await BackgroundRunner.checkPermissions() as any;
  return permission.notifications === 'granted';
}

onMounted( async () => {
  if (Capacitor.isNativePlatform()) {
    await BackgroundRunner.requestPermissions({
      apis: ['notifications', 'geolocation']
    });
  }
})
</script>

<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div @click="presentLanguageSelect" class="v-align-content">
        <div style="float: right">
          <small style="margin-right: 5px">{{ t('select_language') }}</small>
          <ion-img :src="flag" alt="Language Icon" style="width: 25px" />
        </div>
      </div>
      <div class="img-logo-container text-center">
        <ion-img class="img-logo" src="/images/logo.png" alt="TIC logo" />
      </div>
      <div class="login">
        <p class="orange-title text-center">{{ t('login') }}</p>
        <form @submit.prevent="login">
          <ion-list>
            <ion-item class="ion-margin-bottom">
              <ion-input :label="t('username')" label-placement="floating" v-model="username" />
            </ion-item>

            <ion-item class="ion-margin-bottom">
              <ion-input :label="t('password')" label-placement="floating" v-model="password" />
            </ion-item>

            <div
              style="
                display: flex;
                justify-content: flex-end;
                align-items: center;
                padding-left: 15px;
                padding-right: 5px;
              ">
              <small style="margin-right: 5px">Remember</small>
              <ion-toggle color="warning" :checked="remember" v-model="remember"></ion-toggle>
            </div>

            <ion-button
              class="ion-margin-top"
              type="submit"
              expand="block"
              size="large"
              color="energize"
              :disabled="!isFormValid()">
              {{ t('login_button') }}
              <ion-icon slot="end" :icon="send"></ion-icon>
            </ion-button>
          </ion-list>
        </form>
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
ion-content::part(scroll) {
  margin-top: var(--ion-safe-area-top, 0);
}
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
.v-align-content > * {
  display: flex;
  align-content: center;
  align-items: center;
  justify-content: space-evenly;
}
.text-center {
  text-align: center;
}
</style>
