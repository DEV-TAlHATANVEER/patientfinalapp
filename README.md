# Patient Final App

## Overview

The Patient Final App is a comprehensive healthcare application designed to facilitate various medical services, including appointment scheduling, health records management, and telemedicine consultations. The app is built using React Native and Expo, providing a seamless experience across iOS and Android devices.

## Features

- **User Authentication**: Users can register, log in, and manage their profiles.
- **Appointment Scheduling**: Users can book appointments with healthcare providers and manage their schedules.
- **Health Records**: Users can view and manage their health records securely.
- **Telemedicine**: The app supports video consultations with doctors.
- **Payment Integration**: Users can make payments for services using Stripe.
- **Image Uploads**: Users can upload images related to their health records using Cloudinary.

## Project Structure

The project is organized into several key directories:

- **`src/`**: Contains the main application code.
  - **`screens/`**: Contains all the screens of the application, such as appointment scheduling, health records, and user profiles.
  - **`components/`**: Reusable components used throughout the app.
  - **`services/`**: Contains service files for handling API calls and integrations (e.g., Firebase, Cloudinary).
  - **`config/`**: Configuration files, including theme settings.

- **`assets/`**: Contains images and icons used in the application.

- **`app/`**: Contains the main entry point and layout files for the app.

## Versioning

- **Current Version**: `1.0.0`
- The versioning follows [Semantic Versioning](https://semver.org/), where:
  - **Major**: Significant changes that may break compatibility.
  - **Minor**: New features that are backward compatible.
  - **Patch**: Backward-compatible bug fixes.

## EAS (Expo Application Services)

The app is configured to use EAS for building and submitting the application. The `eas.json` file contains the following configurations:

- **Build Configurations**:
  - **Development**: Enables the development client for internal distribution.
  - **Preview**: Internal distribution for preview builds.
  - **Production**: Automatically increments the version for production builds.

- **Submit Configurations**: Configurations for submitting the production build.

## Dependencies

The application relies on several key dependencies, including:

- **React Native**: The core framework for building the app.
- **Expo**: Provides a set of tools and services for building and deploying React Native apps.
- **Firebase**: Used for authentication and database services.
- **Stripe**: For handling payments.
- **Cloudinary**: For image uploads.

## Installation

To install the application, clone the repository and run the following commands:

```bash
npm install
```

To start the development server, use:

```bash
npm start
```

## Conclusion

The Patient Final App aims to provide a user-friendly interface for managing healthcare services. With its robust features and seamless integration of various services, it is designed to enhance the overall patient experience.
