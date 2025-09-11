# EventTrix

![My Website Logo](/Frontend/assets/eventTrix.png)  

Event Trix is a modern mobile application designed to deliver technology news and updates to students, companies, and IT professionals. The app allows IT solutions providers to post updates, while users can subscribe, filter content, and receive notifications in real-time.

Features

User Registration & Login

Register securely with a username and password.

Login using JWT authentication to ensure secure access.

Passwords are hashed using bcrypt for security.

News Feed & Content Management

IT solutions providers can post technology news and updates.

Users can subscribe to specific companies, categories, or topics.

Content can be filtered by category, date, or popularity for efficient browsing.

Notifications & Real-Time Updates

Receive push notifications for new posts from subscribed sources.

WebSocket integration ensures instant updates and dynamic content refresh.

User Personalization

Configure your preferences for notifications and subscriptions.

Manage your account settings, including updating username or password.

Admin & IT Solution Features

Admins and IT solution providers can manage posts, categories, and subscriptions efficiently.

Ensure proper content delivery and manage user subscriptions.

Getting Started

Install & Run

Use Expo Go to run the mobile app on iOS or Android devices.

Make sure the backend .NET API is running and connected to MongoDB.

Register & Verify Account

Open the app and create a new account.

Verification emails are sent via SMTP to confirm user registration.

Enter the verification code to activate your account.

Browse & Subscribe

Explore technology news posted by companies or IT solutions providers.

Subscribe to categories, topics, or companies to receive targeted updates.

Manage Preferences

Configure notifications and subscription settings to match your interests.

Update personal credentials securely.

Posting News (For IT Solution Providers)

Login as a provider/admin.

Create, update, or delete news posts.

Organize posts by categories for better visibility to users.

Tech Stack

Frontend: React Native + Expo Go

Backend: .NET (C#)

Database: MongoDB

Authentication: JWT tokens

Password Security: bcrypt

Email Verification: SMTP

Real-Time Updates: WebSockets

API Requests: Axios

Security Notes

All sensitive user data, including passwords, are securely hashed.

Email verification ensures only valid users can access the app.

JWT tokens protect endpoints from unauthorized access.

Users control their subscriptions and notification preferences securely.inks efficiently.
