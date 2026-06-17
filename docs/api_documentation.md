# AstroVerse - API Documentation

AstroVerse backend APIs are exposed as RESTful services built on **.NET 9 Web API**. 

---

## 1. Global Specifications

- **Base URL**: `https://api.astroverse.com/api/v1` (or local `http://localhost:5000/api/v1`)
- **Authentication**: JWT Bearer token passed in the header:
  `Authorization: Bearer <JWT_TOKEN>`
- **Response Format**: All API responses use standard JSON wrapping:
  ```json
  {
    "success": true,
    "data": { ... },
    "error": null,
    "timestamp": "2026-06-14T07:55:00Z"
  }
  ```
- **Error Codes**:
  - `400 Bad Request`: Validation failures.
  - `401 Unauthorized`: Token missing or expired.
  - `403 Forbidden`: Insufficient role hierarchy.
  - `429 Too Many Requests`: Rate limit threshold exceeded.

---

## 2. Core Endpoints

### 2.1. Authentication Module

#### `POST /auth/register`
Creates a new user account.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "fullName": "John Doe",
    "phoneNumber": "+1234567890"
  }
  ```

#### `POST /auth/login`
Authenticates a user and returns a token.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOiJSUzI1NiIs...",
      "expiresAt": "2026-06-15T07:55:00Z",
      "role": "User",
      "fullName": "John Doe"
    }
  }
  ```

---

### 2.2. Family Vault Module

#### `GET /vault/members`
Fetches all stored family profiles for the authenticated user.
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "e458a2d1-9f93-4a6c-9419-619f7de8b9a1",
        "name": "Jane Doe",
        "relationType": "Spouse",
        "dateOfBirth": "1994-08-15",
        "timeOfBirth": "14:30:00",
        "placeOfBirth": "Mumbai, India",
        "photoUrl": "https://astroverse.blob.core.windows.net/photos/spouse.jpg"
      }
    ]
  }
  ```

#### `POST /vault/members`
Adds a new member profile to the vault.
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "gender": "Female",
    "relationType": "Spouse",
    "dateOfBirth": "1994-08-15",
    "timeOfBirth": "14:30:00",
    "latitude": 18.9750,
    "longitude": 72.8258,
    "placeOfBirth": "Mumbai, India",
    "tags": ["Immediate"],
    "notes": "Spouse's birth profile"
  }
  ```

---

### 2.3. Kundli Generation Module

#### `POST /astrology/kundli`
Generates a detailed birth chart data structure.
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "gender": "Male",
    "dateOfBirth": "1990-06-15",
    "timeOfBirth": "08:15:00",
    "latitude": 28.6139,
    "longitude": 77.2090,
    "placeOfBirth": "New Delhi, India"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "rashi": "Capricorn",
      "nakshatra": "Uttarashadha",
      "ascendant": "Cancer",
      "lagnaChart": {
        "house1": ["Jupiter", "Sun"],
        "house2": ["Mercury"],
        "house7": ["Moon", "Saturn"]
      },
      "planetaryPositions": [
        { "planet": "Sun", "degree": "00:15:45", "rashi": "Gemini", "house": 12 }
      ],
      "doshas": { "isManglik": false, "kaalSarpType": "None" }
    }
  }
  ```

---

### 2.4. AI Assistant Module

#### `POST /ai/chat`
Answers astrological queries utilizing context from the user's family vault.
- **Request Body**:
  ```json
  {
    "message": "Which family member has the strongest career outlook this year?",
    "activeMemberId": "e458a2d1-9f93-4a6c-9419-619f7de8b9a1",
    "language": "en"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "reply": "Based on the transit positions, Jane Doe (Spouse) has Jupiter transiting their 10th house of career from August, indicating strong growth prospects.",
      "contextUsed": ["Jane Doe (Spouse)"]
    }
  }
  ```

---

### 2.5. Translations Console Module

#### `GET /translations`
Retrieves translation matrix.
- **Parameters**: `lang=hi`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "nav_dashboard": "डैशबोर्ड",
      "nav_vault": "एस्ट्रो वॉल्ट",
      "nav_marketplace": "परामर्श बाज़ार"
    }
  }
  ```
