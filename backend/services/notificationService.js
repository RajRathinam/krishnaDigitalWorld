import { Expo } from 'expo-server-sdk';
import Notification from '../models/Notification.js';

// Create a new Expo SDK client
// optionally providing an access token if you have enabled push security
const expo = new Expo();

/**
 * Send a push notification to a user's device
 * @param {string} pushToken - The Expo push token of the user's device
 * @param {string} title - Title of the notification
 * @param {string} body - Body of the notification
 * @param {object} data - Optional data payload
 */
export const sendPushNotification = async (pushToken, title, body, data = {}) => {
  try {
    // Check that all your push tokens appear to be valid Expo push tokens
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      return false;
    }

    // Construct the message
    const messages = [{
      to: pushToken,
      sound: 'default',
      title: title,
      body: body,
      data: data,
      channelId: 'default',
      priority: 'high',
    }];

    // The Expo push notification service accepts batches of notifications
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    // Send the chunks to the Expo push notification service
    for (let chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
        for (const ticket of ticketChunk) {
          if (ticket.status === 'error') {
            console.error(`❌ Push notification ticket error: ${ticket.message} (${ticket.details?.error})`);
          } else {
            console.log(`✅ Push notification sent successfully, ticket id: ${ticket.id}`);
          }
        }
      } catch (error) {
        console.error('Error sending push notification chunk:', error);
      }
    }

    // Optionally handle receipts here, but we will keep it simple for now
    return true;
  } catch (error) {
    console.error('Error in sendPushNotification service:', error);
    return false;
  }
};

/**
 * Notify a user: persists the notification so it shows in their in-app
 * notifications list, and also sends a push alert if they have a device token.
 * @param {object} params
 * @param {number} params.userId
 * @param {'order_shipped'|'order_delivered'|'order_status'|'coupon'} params.type
 * @param {string} params.title
 * @param {string} params.body
 * @param {object} [params.data]
 * @param {string|null} [params.pushToken]
 */
export const notifyUser = async ({ userId, type, title, body, data = {}, pushToken = null }) => {
  try {
    await Notification.create({ userId, type, title, body, data });
  } catch (error) {
    console.error('Error saving notification record:', error);
  }

  if (pushToken) {
    await sendPushNotification(pushToken, title, body, data);
  }
};
