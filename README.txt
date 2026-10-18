# TripWise — Smart Travel Planner

## Project Overview

TripWise is a responsive travel-planning web application that helps users discover interesting places, search for destinations, filter results by category, and organise places they want to visit.

Users can add destinations to their personal itinerary, view saved places, and remove destinations when their plans change. The itinerary is stored in the browser so that saved destinations remain available after refreshing the page.

## Track

Frontend Development — AWS Student Builder Group, VIT Chennai Recruitment Task.

## Technologies Used

- React
- Vite
- Tailwind CSS
- JavaScript
- Geoapify Places API
- Browser Local Storage
- Vercel for deployment

## Features

- Search for destinations using the Geoapify API.
- Filter destinations by category.
- Display destination information and location details.
- Add destinations to My Trip.
- Remove saved destinations from the itinerary.
- Preserve the itinerary across page refreshes using browser storage.
- Responsive interface for desktop and mobile devices.
- Dark-themed user interface.

## API Details

TripWise uses the Geoapify Places API to retrieve place information.

An API key is required to make requests. Store the key in a local `.env` file using the variable name:

`VITE_GEOAPIFY_API_KEY=your_api_key_here`

Do not commit real API keys or private credentials to the public repository.

## Setup and Installation

1. Clone the repository:

   `git clone https://github.com/Chaitanya-Raghuwanshi/tripwise.git`

2. Enter the project directory:

   `cd tripwise`

3. Install dependencies:

   `npm install`

4. Create a `.env` file in the project root and add your Geoapify API key.

5. Start the development server:

   `npm run dev`

6. Open the local URL shown in the terminal.

## Live Demo

https://tripwise-indol-phi.vercel.app/

## GitHub Repository

https://github.com/Chaitanya-Raghuwanshi/tripwise

## Future Improvements

- Add more detailed destination information.
- Improve trip planning with dates and notes.
- Add map previews and additional travel information.
