# 🛍️ Full-Stack Next.js E-Commerce Application

A premium, state-of-the-art full-stack E-commerce platform built with **Next.js 16 (App Router)**, **React 19**, **Mongoose (MongoDB)**, **NextAuth.js** for authentication, **Tailwind CSS v4** for modern styling, **Cloudinary** for listing media uploads, and **Resend** for transactional emails.

---

## 🚀 Key Features

### 🛒 Client-Side Catalog & Shopping Cart
* **Store Catalog (`/show-items`)**: A fully interactive products grid with name and spec filtering.
* **Smart Image Carousels**: Multiple image upload support for items. Users can navigate through product media via hover navigation dots and directional controls directly within catalog cards.
* **Shopping Cart Drawer**: A slide-over checkout panel supporting incrementing/decrementing product quantities, instant item removal, and auto-updated pricing.
* **Profile Settings Modal**: Allows logged-in users to update their profile picture (uploaded to Cloudinary), name, and credential passwords.

### 🛡️ Admin & Inventory Management
* **Add Listings Panel (`/add-items`)**: Admins can upload new items, add up to 5 alternative product images, configure names, prices, and specifications.
* **Inventory Dashboard (`/edite-details`)**: A complete table layout where admins can view all listings, update their details (replacing/adding images, names, pricing), or permanently delete listings.

### 🔑 Authentication & Session Security
* **NextAuth Security**: Leverages JWT-based NextAuth authentication supporting two provider flows:
  * **Credentials Provider**: Secure registration (`/register`) and password-based login (`/login`) with `bcryptjs` hashing.
  * **Google OAuth Provider**: Auto-creates and links pre-verified Google accounts upon successful sign-in.
* **User Roles**: Differentiates views and permissions between standard users (`user`), administrators (`admin`), and super administrators (`super_admin`).

---

## 🛠️ Tech Stack & Dependencies

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 | React framework with App Router, API Routes, and SSR. |
| **Frontend** | React 19 / DOM 19 | Declarative UI library utilizing the latest features. |
| **Styling** | Tailwind CSS v4 | High-performance CSS engine with @tailwindcss/postcss. |
| **Database** | MongoDB & Mongoose | Document-oriented database for users, carts, and items. |
| **Authentication** | NextAuth.js v4 | Flexible authentication supporting Credentials & Google Login. |
| **File Storage** | Cloudinary | Asset delivery and optimization for item listing media. |
| **Emails** | Resend | Simple API integrations for transactional and onboarding emails. |

---

## 📁 Repository Structure

```
d:/E-commerceApp/
├── app/
│   ├── add-items/            # Add item creation page
│   ├── api/
│   │   ├── addCart/          # Cart management API endpoints (GET, POST, PUT, DELETE)
│   │   ├── addItem/          # Catalog item creation & updates (GET, POST, PUT, DELETE)
│   │   ├── auth/             # NextAuth routing backend handlers
│   │   ├── profile/          # User profile fetching & update endpoints (GET, PUT)
│   │   ├── register/         # User credentials registration (POST)
│   │   ├── send-email/       # Resend email handler (POST)
│   │   └── upload/           # Cloudinary buffer upload streaming (POST)
│   ├── edite-details/        # Admin inventory manager table and edit/delete forms
│   ├── login/                # Auth login portal page
│   ├── register/             # User credentials registration page
│   ├── show-items/           # Main store catalog, cart drawer & profile manager
│   ├── globals.css           # Global CSS variables & custom utilities
│   └── layout.tsx            # Global layout wrapper injecting SessionProvider
├── components/
│   ├── Navbar.tsx            # Context-aware navigation bar
│   ├── ProfileModal.tsx      # User profile image & password management dialog
│   └── SessionProvider.tsx   # NextAuth session context wrapper
├── lib/
│   ├── auth.ts               # NextAuth setup, callbacks, session definitions & schema typings
│   ├── cloudinary.ts         # Cloudinary configuration exports
│   └── database.ts           # Cached database connection pool manager for MongoDB
├── models/
│   ├── addCart.ts            # Mongoose Cart schema definition
│   ├── additems.ts           # Mongoose Product/Item schema definition
│   └── userModel.ts          # Mongoose User schema definition
├── package.json              # Script run-commands and dependency tree
└── tsconfig.json             # Typescript compilation settings
```

---

## 🛢️ Database Schema Schemas (`models/`)

### 1. User Schema (`userModel.ts`)
Stores registration accounts and links OAuth profiles.
* `name` (String, Required)
* `email` (String, Unique, Lowercase)
* `password` (String, Required for `credentials` provider only)
* `image` (String, Profile image URL)
* `role` (String, enum: `["user", "admin", "super_admin"]`, default: `"user"`)
* `provider` (String, enum: `["credentials", "google"]`)
* `providerId` (String, Optional Google account identifier)
* `darkMode` (Boolean, default: `false`)
* `isVerified` (Boolean, default: `true`)

### 2. Item Listing Schema (`additems.ts`)
Stores listed merchandise products.
* `name` (String, Required)
* `description` (String, Required)
* `price` (String, Required)
* `imageUrl` (Array of Strings, default: `[]`)

### 3. Cart Schema (`addCart.ts`)
Manages non-checkout active shopping carts for shoppers.
* `userId` (String, Required)
* `items` (Array):
  * `itemId` (String, Required)
  * `quantity` (Number, Required)
  * `price` (Number, Required)

---

## 📡 API Reference Endpoint Map

### Auth & User Registration
* **`POST /api/register`**: Creates new credential users. Hashes password with a salt round of 12.
* **`GET /api/profile`**: Returns current logged-in user profile details (excludes password hash).
* **`PUT /api/profile`**: Saves modified profile details (supports password modifications and avatar image uploads).

### Products & Inventory Catalog
* **`GET /api/addItem`**: Fetches all available products listing items in the database.
* **`POST /api/addItem`**: Registers a new product listing to the MongoDB collections.
* **`PUT /api/addItem`**: Finds and updates field details of specified catalog listings.
* **`DELETE /api/addItem`**: Deletes target catalog items from MongoDB records.

### Shopper Cart Management
* **`GET /api/addCart`**: Fetches cart entries for the active session user, populated with names, specifications, and primary images.
* **`POST /api/addCart`**: Appends selected items to the user's cart or increments active quantity.
* **`PUT /api/addCart`**: Updates exact item counts in cart drawer. Removes elements if quantity is set to 0.
* **`DELETE /api/addCart`**: Removes specific items from cart or completely clears the user's active cart.

### Media & Notifications
* **`POST /api/upload`**: Takes standard multipart form-data uploads and streams them to Cloudinary. Returns the secure asset URL.
* **`POST /api/send-email`**: Connects with Resend to dispatch onboarding welcome emails.

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory and define the following variables:

```env
# MongoDB Connection
MONGODB_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/dbname

# NextAuth Config
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=your_next_auth_secret_key

# Google OAuth Provider (Optional)
AUTH_GOOGLE_ID=google_client_id
AUTH_GOOGLE_SECRET=google_client_secret

# Cloudinary Storage Config
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Resend Email Config
RESEND_API_KEY=re_your_resend_api_key
```

---

## 🏃 Getting Started & Development

### 1. Installation
Clone the repository and install the dependencies:
```bash
npm install
```

### 2. Run the Development Server
Launch the local development environment:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser to view the application.

### 3. Production Build
To construct a production build optimized for deployment:
```bash
npm run build
npm start
```