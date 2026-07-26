export type NotificationType = 'order_ready' | 'table_ready' | 'reservation_reminder' | 'low_stock_alert' | 'bill_ready' | 'queue_notified'

export type NotificationRecipient = {
  type: 'user' | 'phone'
  id?: string
  phone?: string
}

export type NotificationPayload = {
  title: string
  message: string
  data?: Record<string, unknown>
}

export async function sendNotification(
  type: NotificationType,
  recipient: NotificationRecipient,
  payload: NotificationPayload,
): Promise<void> {
  console.log(`[NOTIFICATION] Type: ${type}`, {
    recipient,
    payload,
    timestamp: new Date().toISOString(),
  })

  if (recipient.type === 'phone' && recipient.phone) {
    console.log(`[SMS] Would send SMS to ${recipient.phone}: ${payload.message}`)
  }

  return Promise.resolve()
}
