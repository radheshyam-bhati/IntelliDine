import { z } from 'zod'

export const createOrderSchema = z.object({
  restaurant_id: z.string().uuid('Restaurant ID must be a valid UUID'),
  table_id: z.string().uuid('Table ID must be a valid UUID'),
  customer_id: z.string().uuid().nullable().optional(),
  items: z.array(z.object({
    menu_item_id: z.string().uuid('Menu item ID must be a valid UUID'),
    quantity: z.number().int().positive('Quantity must be a positive integer'),
    special_request: z.string().max(500).nullable().optional(),
  })).min(1, 'At least one item is required'),
})

export const updateOrderStatusSchema = z.object({
  status: z.enum(['placed', 'received', 'cooking', 'ready', 'served', 'completed', 'cancelled'], {
    errorMap: () => ({ message: 'Invalid order status' }),
  }),
})

export const createMenuItemSchema = z.object({
  restaurant_id: z.string().uuid('Restaurant ID must be a valid UUID'),
  category_id: z.string().uuid('Category ID must be a valid UUID'),
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional().default(''),
  price: z.number().positive('Price must be positive'),
  image_url: z.string().url().nullable().optional(),
  dietary_tags: z.array(z.string()).optional().default([]),
  is_manual_override: z.boolean().optional().default(false),
  availability_window: z.object({
    start: z.string(),
    end: z.string(),
  }).nullable().optional(),
  ingredient_ids: z.array(z.string().uuid()).optional().default([]),
})

export const updateMenuItemSchema = z.object({
  category_id: z.string().uuid().optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  price: z.number().positive().optional(),
  image_url: z.string().url().nullable().optional(),
  dietary_tags: z.array(z.string()).optional(),
  is_available: z.boolean().optional(),
  is_manual_override: z.boolean().optional(),
  availability_window: z.object({
    start: z.string(),
    end: z.string(),
  }).nullable().optional(),
})

export const createIngredientSchema = z.object({
  restaurant_id: z.string().uuid('Restaurant ID must be a valid UUID'),
  name: z.string().min(1, 'Name is required').max(200),
  unit: z.string().min(1, 'Unit is required').max(50),
  current_stock: z.number().nonnegative('Stock cannot be negative').default(0),
  reorder_threshold: z.number().nonnegative().default(0),
  supplier_name: z.string().max(200).nullable().optional(),
})

export const updateIngredientSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  unit: z.string().min(1).max(50).optional(),
  current_stock: z.number().nonnegative().optional(),
  reorder_threshold: z.number().nonnegative().optional(),
  supplier_name: z.string().max(200).nullable().optional(),
})

export const createReservationSchema = z.object({
  restaurant_id: z.string().uuid('Restaurant ID must be a valid UUID'),
  customer_name: z.string().min(1, 'Customer name is required').max(200),
  customer_phone: z.string().min(1, 'Phone number is required').max(20),
  party_size: z.number().int().positive('Party size must be positive'),
  reserved_for: z.string().min(1, 'Reservation time is required'),
  table_id: z.string().uuid().nullable().optional(),
})

export const createQueueEntrySchema = z.object({
  restaurant_id: z.string().uuid('Restaurant ID must be a valid UUID'),
  customer_name: z.string().min(1, 'Customer name is required').max(200),
  customer_phone: z.string().min(1, 'Phone number is required').max(20),
  party_size: z.number().int().positive('Party size must be positive'),
})

export const createBillSchema = z.object({
  restaurant_id: z.string().uuid('Restaurant ID must be a valid UUID'),
  table_id: z.string().uuid('Table ID must be a valid UUID'),
  order_ids: z.array(z.string().uuid()).min(1, 'At least one order is required'),
  include_service_charge: z.boolean().optional().default(true),
})

export const updatePaymentStatusSchema = z.object({
  payment_status: z.enum(['unpaid', 'partial', 'paid'], {
    errorMap: () => ({ message: 'Invalid payment status' }),
  }),
  payment_reference: z.string().max(200).nullable().optional(),
})

export const modifyOrderItemsSchema = z.object({
  items: z.array(z.object({
    menu_item_id: z.string().uuid('Menu item ID must be a valid UUID'),
    quantity: z.number().int().positive('Quantity must be a positive integer'),
    special_request: z.string().max(500).optional(),
  })).min(1, 'At least one item is required'),
})

export const updateSpecialRequestSchema = z.object({
  item_id: z.string().uuid('Item ID must be a valid UUID'),
  special_request: z.string().max(500, 'Special request must be 500 characters or less'),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>
export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>
export type CreateIngredientInput = z.infer<typeof createIngredientSchema>
export type UpdateIngredientInput = z.infer<typeof updateIngredientSchema>
export type CreateReservationInput = z.infer<typeof createReservationSchema>
export type CreateQueueEntryInput = z.infer<typeof createQueueEntrySchema>
export type CreateBillInput = z.infer<typeof createBillSchema>
export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusSchema>
