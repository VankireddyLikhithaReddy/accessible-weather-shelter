# Accessible Weather & Shelter Finder 
*A Web Application Designed for Blind & Visually Impaired Individuals*

---

## Overview  
Accessible Weather & Shelter Finder is a **full-stack MERN-based web application** built to help **blind and visually impaired individuals** quickly access weather information and find nearby emergency shelters.

Traditional weather and emergency websites are often cluttered, non-accessible, and difficult for screen readers.  
Our platform prioritizes **accessibility, clarity, and safety**, offering:

- Clean & minimal interface  
- Keyboard-only navigation  
- High-contrast mode  
- Text-to-speech (TTS) readouts  
- Emergency SOS request system  
- Real-time severe weather alerts  

This application ensures that visually impaired users can **independently** access critical safety information.

---

## Product Vision  
**FOR** visually impaired users  
**WHO** struggle with non-accessible weather and shelter websites  
**OUR PRODUCT** is an Accessible Weather & Safety Application  
**THAT** provides:  
- Real-time weather  
- Severe alerts  
- Nearby shelters  
- SOS functionality  
- Full accessibility support  
**UNLIKE** traditional weather apps that lack accessibility features.

---

## Features  

### Accessibility-Focused UI
- Fully keyboard navigable  
- ARIA labels & screen-reader-friendly  
- High-contrast theme option  
- Large-font compatibility  
- Shortcut keys  
  - `1` → Weather  
  - `2` → Shelter Finder  
  - `3` → SOS Emergency  

### Weather Module
- Real-time weather data  
- Temperature, humidity, wind, visibility  
- Severe weather alerts  
- Automated text-to-speech weather readout  
- Minimal UI for clarity  

### Shelter Finder
- Auto-location detection using HTML5 geolocation  
- Nearest shelters based on coordinates  
- Shelter name, address, distance  
- Clean list design optimized for accessibility  

### SOS Emergency Module
- One-click SOS button  
- Sends user's GPS coordinates to backend  
- Stores SOS request in MongoDB  
- Can be extended for SMS/email alerts  

### Backend Features
- Node.js + Express REST API  
- Weather microservice integration  
- Shelter discovery service  
- SOS logging & validation  
- Modular service and route-level architecture  

### DevOps & Deployment
- Backend Renderfile  
- Render Compose (Backend + MongoDB + optional Mongo Express)  
- Environment variable configuration  
- Clean CI/CD-ready project structure  


## Tech Stack  

### **Frontend**
- React.js  
- Web Speech API (TTS)  
- Fetch / Axios  
- Accessibility-first UI design  

### **Backend**
- Node.js  
- Express.js  
- MongoDB (SOS logging)  
- Weather API  
- Geo-based shelter lookup  

### **Deployment**
- Render  
- Render Compose  
- Environment Variables  


## Running the Application Locally  

### **1. Clone the Repository**
```bash
git clone https://github.com/VankireddyLikhithaReddy/accessible-weather-shelter.git>
cd accessible-weather-shelter

```
### **Backend**

```bash
cd backend
npm install
npm start

```
### **Frontend Setup**

```
cd weather-shelter
npm install
npm start

```
**Team Memers**
- Likhitha
- Sravya
- Abhilash Reddy
- Jaya Suriya
- Karthik
- Rakesh
