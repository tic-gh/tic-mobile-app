import { CapacitorHttp } from '@capacitor/core';
const SLACK_WEBHOOK_URL = import.meta.env.VITE_SLACK_WEBHOOK_URL;

/**
 * Sends location data to Slack via webhook.
 * @param latitude number
 * @param longitude number
 * @param accuracy number
 * @param id_number string
 * @param address string
 */
export async function sendLocationToSlack(userId: number, reportNo: number, imagesToUploadCount: number, errorMessage: string, versionNumber: string): Promise<void> {
  const payload = {
    text: `📍 ZipUpload Error:\nuserId: ${userId}\nreportNo: ${reportNo}\nimagesToUploadCount: ${imagesToUploadCount}\nerrorMessage: ${errorMessage}\nversionNumber: ${versionNumber}`
  }
  try {
    const response = await CapacitorHttp.post({
      url: SLACK_WEBHOOK_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      data: payload,
    })
    if (response.status < 200 || response.status >= 300) {
      console.error('Failed to send location to Slack:', response.status, response.data)
    }
  } catch (error) {
    console.error('Error sending location to Slack:', error)
  }
}
