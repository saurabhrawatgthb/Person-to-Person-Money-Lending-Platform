# MongoDB Schema Documentation

The application uses MongoDB as its primary database. The Mongoose schemas are defined in the `backend/src/models` directory.

## 1. User Schema (`User.ts`)
Stores user profiles, locations for algorithmic matching, and trust scores.
- **name**: String (Required)
- **email**: String (Required, Unique)
- **password**: String (Required, Hashed)
- **phone**: String
- **trustScore**: Number (Default: 100)
- **location**: GeoJSON Point (longitude, latitude) - Used for geo-spatial queries to find nearby matches.
- **rating**: Number (Default: 5.0)
- **history**: Array of ObjectIds referencing `Transaction`

## 2. Request Schema (`Request.ts`)
Stores borrowing/lending requests (money or items).
- **user_id**: ObjectId referencing `User` (Required)
- **type**: String (Enum: 'Item', 'Money') (Required)
- **description**: String (Required)
- **urgencyLevel**: String (Enum: 'Low', 'Medium', 'High') (Default: 'Medium')
- **durationHours**: Number (Required) - How long item/money is needed.
- **status**: String (Enum: 'Open', 'Matched', 'Completed', 'Cancelled') (Default: 'Open')
- **matched_users**: Array of Objects containing:
  - **user_id**: ObjectId referencing `User`
  - **score**: Number (Algorithmic match score)
  - **status**: String (Enum: 'Pending', 'Accepted', 'Declined')

## 3. Transaction Schema (`Transaction.ts`)
Stores active and past transactions between users.
- **lender_id**: ObjectId referencing `User` (Required)
- **borrower_id**: ObjectId referencing `User` (Required)
- **request_id**: ObjectId referencing `Request` (Required)
- **status**: String (Enum: 'Pending', 'Active', 'Returned', 'Disputed') (Default: 'Pending')
- **ratingByLender**: Number (1-5)
- **ratingByBorrower**: Number (1-5)

## 4. Notification Schema (`Notification.ts`) (If applicable)
Stores system and user-to-user notifications for the WebSocket system.

## How to Run the Database
A `docker-compose.yml` file has been provided to run the MongoDB database locally.

1. Ensure Docker is installed and running.
2. Run the following command in the root directory:
   ```bash
   docker-compose up -d
   ```
3. The database will be available at `mongodb://localhost:27017/smart-p2p-lending`.
