# Smart Campus (SouEats) - Workflow, Panels, Data, and Features

## 1) End-to-End Workflow

### User Onboarding and Access
1. User opens app and lands on Login/Register.
2. User chooses role during registration:
   - Customer: account is auto-approved and logged in.
   - Shopkeeper: account is created in pending state and needs admin approval.
3. Login returns JWT token + user profile, stored in cookies (`soueats_token`, `soueats_user`).
4. App routes user by role:
   - `customer` -> Customer App
   - `shopkeeper` -> Shopkeeper Panel
   - `admin` -> Admin Dashboard

### Customer Ordering Flow
1. Customer opens `Canteen` tab.
2. App loads stalls (`GET /api/stalls`) and default stall menu (`GET /api/menu?stallId=<id>`).
3. Customer searches menu items locally, adds/removes cart items, selects pickup time.
4. Customer applies admin-provided coupon (`POST /api/coupons/validate`) in cart.
5. Customer confirms payment via Razorpay.
6. On payment success, frontend sends order payload to backend (`POST /api/orders`).
7. Backend validates and stores coupon redemption in DB.
8. Customer tracks order in `My Orders` (`GET /api/orders/my-orders`) with periodic refresh.
9. Once order is `ready/completed`, customer can submit feedback (`POST /api/feedbacks`).

### Shopkeeper Operations Flow
1. Shopkeeper enters panel (must have `stallId` linked).
2. `Orders` tab:
   - Loads stall orders (`GET /api/orders?stallId=<id>`).
   - Shopkeeper updates order status (`PUT /api/orders/:id/status`).
3. `Menu` tab:
   - Loads own menu (`GET /api/menu?stallId=<id>`).
   - Creates menu item (`POST /api/menu`).
   - Updates product price (`PUT /api/menu/:id`).
   - Deletes menu item (`DELETE /api/menu/:id`).

### Admin Governance Flow
1. Admin opens dashboard with tabs:
   - Shopkeeper Approvals
   - Manage Stalls
   - Manage Menu
   - Coupons
   - Feedback Insights
2. Admin approves/rejects pending shopkeepers (`PUT /api/admin/approve-shopkeeper/:id`).
3. Admin manages stalls (`POST/DELETE /api/stalls`).
4. Admin manages all menu items (`GET/POST/DELETE /api/menu`).
5. Admin creates and manages coupon codes (`GET/POST/PUT/DELETE /api/coupons`).
6. Admin generates AI feedback analysis (`GET /api/ai/feedback-analysis`).

### AI and Search Assist Flow
1. Chatbot widget sends conversation text to backend (`POST /api/ai/chat`) and returns Gemini reply.
2. Search API supports full-text search and suggestions:
   - `GET /api/search`
   - `GET /api/search/suggestions`
   - `GET /api/search/popular`

---

## 2) Panel-by-Panel Data Explanation

## A) Authentication Screens (Login/Register/Forgot/Reset)
### Login Data
- Inputs: `email`, `password`
- Response data: `id`, `name`, `email`, `role`, `stallId`, `department`, `token`
- Stored in cookies: auth token + user profile

### Register Data
- Common inputs: `name`, `email`, `password`, `confirmPassword`, `department`, `role`
- Shopkeeper-only input: `stallId`
- Customer registration: token returned (auto-login)
- Shopkeeper registration: no token; pending approval state

### Forgot/Reset Password Data
- Forgot: `email` -> success message (+ `devToken` in dev mode)
- Reset: `token`, `newPassword` -> password update success

## B) Customer Panel - Canteen Tab
### Stalls Sidebar Data
- `id`, `stallName`, `specialty`, `rating`, `description`, `image`

### Menu Grid Data
- `id`, `stallId`, `name`, `price`, `description`, `image`, `popular`

### Cart and Checkout Data
- Per cart item: `id`, `name`, `price`, `quantity`, `stallId`, `image`
- Checkout meta: `pickupTime`, `cartTotal`
- Payment data (Razorpay callback):
  - `razorpay_payment_id`
  - `razorpay_order_id`
  - `razorpay_signature`

### Order Create Payload
- `user`: `{ id, name, email }`
- `items`: cart items array
- `total`
- `originalTotal`
- `discountAmount`
- `couponCode`
- `pickupTime`
- `paymentId`, `paymentOrderId`, `paymentSignature`

## C) Customer Panel - My Orders Tab
### Order Card Data
- `id`, `status`, `timestamp`, `pickupTime`, `paymentStatus`, `total`
- `stallName`, `stallSpecialty`
- `user` object
- `items`: `name`, `quantity`, `price`, `stallId`, `status`

### Tracking and Timeline
- Status stages: `pending -> preparing -> ready -> completed`
- Manual refresh + auto-refresh every 30s

### Feedback Modal Data
- `stall` (stall name)
- `item` (selected item or General)
- `rating` (1-5)
- `comments`
- `userId`

## D) Customer Panel - Profile Tab
### Displayed Data
- `name`, `email`, `phone/mobile`, `role`, `id`, `createdAt`
- Derived UI values: initials, member since date, active badge

## E) Shopkeeper Panel - Orders Tab
### Loaded Data
- Stall-filtered orders by `stallId`
- Order-level: `id`, `status`, `timestamp`, `user`
- Item-level: `name`, `price`, `quantity`, `stallId`

### Actions
- Filter by status
- Update status (`pending/preparing/ready/completed/cancelled`)

## F) Shopkeeper Panel - Menu Tab
### Loaded Data
- `id`, `stallId`, `name`, `price`, `description`, `image`, `popular`, optional `category`

### Create Item Data
- Input: `name`, `price`, `description`, `image`, `stallId`

### Price Update Data
- Update payload: `stallId`, `name`, `price`, `description`, `image`, `popular`
- Endpoint: `PUT /api/menu/:id`

### Delete Item Data
- Target by menu item `id`

## G) Admin Panel - Shopkeeper Approvals
### Pending Data
- `id`, `name`, `email`, `department`, `stallId`, `createdAt`, `stallName`, `specialty`

### Approved Data
- `id`, `name`, `email`, `stallId`, `isActive`, `stallName`, `specialty`, `rating`

### Actions
- Approve (sets `isApproved=1`, maps user to stall)
- Reject (deletes pending shopkeeper)
- Toggle active status (endpoint available)

## H) Admin Panel - Stall Management
### Stall Data
- `id`, `stallName`, `description`, `specialty`, `rating`, `image`, `shopkeeperId`

### Actions
- Create stall
- Delete stall (also deletes linked menu items)

## I) Admin Panel - Menu Management
### Menu Data (All Stalls)
- `id`, `stallId`, `itemName/name`, `description`, `price`, `category`, `stallName`

### Actions
- Filter by stall
- Create menu item
- Delete menu item

## J) Admin Panel - Feedback Insights
### AI Insights Data
- `count` (feedback records analyzed)
- `insights` (Gemini generated summary)
- `recent` feedback rows: `rating`, `comments`, `timestamp`, `stallName`, `itemName`

## K) Admin Panel - Coupons
### Coupon Data
- `id`, `code`, `discountType`, `discountValue`, `minOrderAmount`, `maxDiscount`, `usageLimit`, `usedCount`, `isActive`, `expiresAt`

### Actions
- Create coupon
- Toggle active/inactive
- Delete coupon

## L) Global Chatbot Widget
### Conversation Data
- UI messages: `{ role, content }`
- API payload: `message`, `context` (last message window)
- API response: `reply`

---

## 3) Complete Feature List

### Authentication and Access
- Role-based auth (customer/shopkeeper/admin)
- JWT login with cookie storage
- Shopkeeper approval gate before login
- Forgot password + reset password flow
- Session restore on app load

### Customer Features
- Stall browsing with ratings/specialties
- Stall-wise menu browsing
- Local menu search filter
- Cart add/remove with quantity management
- Pickup time selection
- Coupon apply/remove in cart
- Razorpay payment integration
- Order placement after payment
- My orders history and status tracking
- Expandable order details and timeline
- Feedback submission per completed order
- Profile summary view

### Shopkeeper Features
- Stall-bound order inbox
- Live-like polling refresh (30s)
- Status filter and status updates
- Stall-specific menu CRUD (create/delete)
- Product price editing

### Admin Features
- Pending/approved shopkeeper management
- Approve/reject workflow
- Stall management (create/delete)
- Menu management across stalls
- Coupon management (create/toggle/delete)
- AI-generated feedback analytics + recent feedback view

### Platform and System Features
- REST API with modular routes/controllers
- Input validation middleware
- Security headers and request sanitization
- Error handling and request logging
- Health endpoint (`/health`)
- No-cache API headers for fresh data
- Search API (query, suggestions, popular)
- Gemini AI integration (chat + feedback analysis)
- DB-backed coupon validation and redemption tracking

---

## 4) Main Frontend-Backend Mapping

- Frontend base API: `VITE_API_BASE` (default `http://localhost:5000/api`)
- Frontend stack: React + Vite + Tailwind + Lucide
- Backend stack: Express + MySQL (`mysql2`) + JWT + bcrypt
- AI provider: Google Gemini via REST
- Payment provider: Razorpay (frontend checkout flow)

This file is the single source document for workflow, panel data understanding, and full feature inventory.

---

## 5) Newly Added Features (Latest)

### A) Shopkeeper Price Management
- Shopkeepers can now edit item prices directly from their menu panel.
- UI action: inline edit/save on each menu item card.
- API used: `PUT /api/menu/:id`
- Data stored in DB: `menu.price`

### B) Admin Coupon Management
- Admin now has a dedicated `Coupons` screen in dashboard.
- Admin can:
  - Create coupon code
  - Activate/deactivate coupon
  - Delete coupon
- Admin coupons are global (apply to all stalls).
- Coupon configuration supports:
  - `discountType` (`percentage` / `fixed`)
  - `discountValue`
  - `minOrderAmount`
  - `maxDiscount`
  - `usageLimit`
  - `expiresAt`

### C) Customer Coupon Apply Flow
- Customer can enter coupon code in cart before checkout.
- System validates coupon and shows:
  - Subtotal
  - Discount
  - Final payable amount
- API used: `POST /api/coupons/validate`
- Coupon validation is stall-aware, so stall coupons only work for that stall.
- Customer sees a header offer slidebar on each selected stall with:
  - Stall coupons
  - Global admin coupons

### D) Coupon + Order DB Storage
- Coupon master data stored in: `coupons` table
- Coupon usage history stored in: `coupon_redemptions` table
- Order uses discounted final amount in: `orders.total`
- Coupon redemption tracking includes:
  - `couponId`, `orderId`, `userId`, `code`
  - `orderAmount`, `discountAmount`, `finalAmount`
- Coupon scope fields:
  - `stallId` (`NULL` = admin/global coupon, non-NULL = shopkeeper stall coupon)
  - `createdByRole` (`admin` or `shopkeeper`)

### F) Shopkeeper Coupon Management
- Shopkeepers can create coupons only for their own stall.
- Shopkeepers can view/toggle/delete only their own stall coupons.
- Shopkeeper coupon data is stored in DB with `stallId` mapped to that shop.

### E) Migration Added
- SQL migration file:
  - `soueats-backend/database/migration_coupons.sql`
