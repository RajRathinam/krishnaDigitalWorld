import { Expo } from 'expo-server-sdk';

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
    }];

    // The Expo push notification service accepts batches of notifications
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    // Send the chunks to the Expo push notification service
    for (let chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
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
