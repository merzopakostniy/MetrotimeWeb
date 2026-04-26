# Web архитектура

Статус: черновик, требует подтверждения после выбора стека.

## Предварительный стек

- Frontend: React / Next.js.
- UI: mobile-first PWA.
- Backend: server routes / отдельный API.
- База данных: Supabase Postgres или Firebase/Firestore после сравнения.
- Auth: Supabase Auth или Firebase Auth после выбора базы.
- Платежи: Stripe / YooKassa / CloudPayments после выбора рынка и юр.схемы.
- Deploy: Vercel / Railway.

## Архитектурные принципы

- Клиент не хранит секреты.
- Платежи подтверждаются только на сервере через webhook.
- Расчеты вынести в чистые функции и покрыть тестами.
- Модель роли пользователя хранить как enum.
- Смены хранить как отдельные записи, а не одним большим JSON-документом.
- Данные пользователя изолировать по `user_id`.

## Предварительные сущности

### UserProfile

- `id`;
- `user_id`;
- `display_name`;
- `role`;
- `tariff_rate`;
- `experience_date`;
- `qualification_class`;
- `is_mentor`;
- `is_union_member`;
- `alimony_enabled`;
- `alimony_percent`;
- `created_at`;
- `updated_at`.

### Shift

- `id`;
- `user_id`;
- `date`;
- `name`;
- `start_time`;
- `end_time`;
- `adjusted_start_time`;
- `adjusted_end_time`;
- `start_point`;
- `end_point`;
- `notes`;
- `flags`;
- `base_earnings`;
- `mentor_bonus`;
- `total_earnings`;
- `break_between_shifts`;
- `next_shift_start_time`;
- `created_at`;
- `updated_at`.

### Subscription

- `id`;
- `user_id`;
- `provider`;
- `provider_customer_id`;
- `provider_subscription_id`;
- `status`;
- `plan`;
- `current_period_start`;
- `current_period_end`;
- `created_at`;
- `updated_at`.

### PaymentEvent

- `id`;
- `provider`;
- `event_id`;
- `event_type`;
- `payload`;
- `received_at`;
- `processed_at`;

## Открытые вопросы

- Какой платежный провайдер использовать для целевой аудитории.
- Нужна ли миграция данных из iOS в web на первом запуске.
- Оставляем ли Firebase ради совместимости с iOS или выбираем Supabase/Postgres ради нормальной модели данных.
- Какие функции будут Premium, а какие бесплатные.

