# SahhaBot - مساعد طبي

An intelligent medical assistant designed to provide preliminary health information and locate nearby healthcare facilities, particularly beneficial for rural areas in Morocco.

## Table of Contents

-   [About](#about)
-   [Features](#features)
-   [How It Works](#how-it-works)
    -   [Symptom Analysis](#symptom-analysis)
    -   [Healthcare Facility Finder](#healthcare-facility-finder)
-   [Technologies Used](#technologies-used)
-   [Setup and Installation](#setup-and-installation)
-   [Usage](#usage)
-   [Future Enhancements](#future-enhancements)
-   [Disclaimer](#disclaimer)

## About

SahhaBot aims to bridge the gap in immediate medical guidance and access to healthcare facility information, especially in regions where direct medical consultation might be challenging. Users can describe their symptoms, receive an AI-powered assessment, and find nearby hospitals or pharmacies.

## Features

* **AI-Powered Symptom Analysis**: Users can input their symptoms via text or voice, and the bot provides possible conditions, recommended actions, and an urgency level.
* **Offline Fallback**: The application is designed to provide basic symptom analysis even when offline, using a pre-defined set of common medical conditions and advice.
* **Healthcare Facility Finder**: Helps users locate nearby hospitals, clinics, and pharmacies based on their current location. (Currently uses mock data; real-time integration is a planned enhancement).
* **Multilingual Support**: Supports Arabic (العربية), French (Français), and Darija (الدارجة) for a broader user base in Morocco.
* **Speech-to-Text Input**: Allows users to speak their symptoms for convenience.
* **Text-to-Speech Output**: Provides audio narration of the symptom analysis.
* **Progressive Web App (PWA)**: Offers an installable, offline-first experience for enhanced accessibility and reliability.
* **Responsive User Interface**: Built with Tailwind CSS and Shadcn UI for a modern and adaptive design across various devices.

## How It Works

### Symptom Analysis

1.  **User Input**: Users describe their symptoms using a text input field or by speaking into their device's microphone.
2.  **Client-Side AI Service**: The application's `AIService` first checks a local cache for similar symptom analyses to provide instant results if available.
3.  **API Call (Online)**: If no cached data is found and the device is online, the symptoms are sent to a Next.js API route (`/api/analyze-symptoms`).
4.  **Cohere API Integration**: The Next.js API route processes the symptoms, constructs a detailed prompt, and sends it to the Cohere AI API. Cohere then generates a structured medical assessment.
5.  **Response Processing**: The API route parses Cohere's response, extracts relevant information (possible conditions, recommendations, urgency, confidence), and sends it back to the client.
6.  **Offline Fallback**: If the device is offline or the Cohere API call fails, the `AIService` falls back to a curated, hardcoded database of common symptoms and their corresponding general advice, ensuring basic functionality.
7.  **Display**: The analysis is then displayed to the user, categorized by severity, with actionable recommendations.

### Healthcare Facility Finder

1.  **Location Access**: The application requests the user's current geographic location (latitude and longitude).
2.  **API Call (Planned)**: The user's location is sent to a dedicated Next.js API route (`/api/healthcare-facilities`).
3.  **OpenStreetMap Integration (Planned)**: This server-side route will query OpenStreetMap's Nominatim or Overpass API to find nearby hospitals, clinics, and pharmacies.
4.  **Data Presentation**: The retrieved real-time facility data (name, address, contact, hours, services, distance) will be displayed to the user, with options to get directions.

## Technologies Used

* **Framework**: Next.js 13 (React)
* **Language**: TypeScript
* **Styling**: Tailwind CSS, Shadcn UI
* **AI Model**: Cohere (via API)
* **Geolocation/Mapping**: OpenStreetMap (planned for real-time data)
* **State Management**: React Hooks
* **UI Components**: Radix UI primitives
* **Internationalization**: Custom `i18n` utility

## Setup and Installation

To get SahhaBot up and running on your local machine:

1.  **Clone the repository**:
    ```bash
    git clone <your-repo-url>
    cd sahhaBot
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Environment Variables**:
    Create a `.env.local` file in the root of your project and add your Cohere API key:
    ```
    COHERE_API_KEY="YOUR_COHERE_API_KEY"
    ```
    * You can obtain a Cohere API key from the [Cohere website](https://cohere.com/).

4.  **Run the development server**:
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

5.  **Build for production**:
    ```bash
    npm run build
    # or
    yarn build
    ```
    Then, start the production server:
    ```bash
    npm start
    # or
    yarn start
    ```
## Usage

1.  **Describe Symptoms**: On the main page, type your symptoms into the text area or use the microphone icon for voice input.
2.  **Get Analysis**: Click the "Symptoms" button to receive a medical analysis, including possible conditions and recommendations.
3.  **Find Healthcare**: Navigate to the "Find Healthcare" tab to see nearby hospitals and pharmacies (currently mock data, real data coming soon!).
4.  **Change Language**: Use the language selector in the header to switch between Arabic, French, and Darija.

## Future Enhancements

* **Real-time Healthcare Facility Data**: Integrate with OpenStreetMap (Nominatim/Overpass API) to fetch actual nearby hospitals, clinics, and pharmacies based on the user's live location.
* **Improved Offline Capabilities**: Expand the offline symptom database and potentially implement IndexedDB for persistent storage of past analyses.
* **User Authentication**: Implement user accounts to save symptom history and preferences.
* **Enhanced AI Interactions**: Further refine AI prompts for more nuanced and personalized medical advice.

## Disclaimer

**⚠️ This application is for preliminary medical assistance and informational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of a qualified healthcare provider for any medical questions or concerns. In case of a medical emergency, please call 150 (Morocco emergency number) or your local emergency services immediately.**


## Licence
  [this project is built in with mit licence commercial check it by clicking the link](Licence)
