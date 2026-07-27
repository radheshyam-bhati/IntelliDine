import { Resend } from 'resend'
import { SupabaseClient } from '@supabase/supabase-js'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export type NotificationType = 'order_ready' | 'table_ready' | 'reservation_reminder' | 'low_stock_alert' | 'bill_ready' | 'queue_notified' | 'bill_generated' | 'payment_updated' | 'order_status_updated'

export type NotificationRecipient = {
  type: 'user' | 'phone' | 'email'
  id?: string
  phone?: string
  email?: string
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

  if (recipient.type === 'email' && recipient.email) {
    if (resend) {
      try {
        await resend.emails.send({
          from: 'KitchenSync <noreply@kitchensync.app>',
          to: recipient.email,
          subject: payload.title,
          html: `<p>${payload.message}</p>`,
        })
        console.log(`[EMAIL] Sent to ${recipient.email}`)
      } catch (err) {
        console.error(`[EMAIL] Failed to send email to ${recipient.email}`, err)
      }
    } else {
      console.log(`[EMAIL STUB] Would send email to ${recipient.email}: ${payload.message}`)
    }
  }

  if (recipient.type === 'phone' && recipient.phone) {
    console.log(`[SMS STUB] Would send SMS to ${recipient.phone}: ${payload.message}`)
  }

  return Promise.resolve()
}
