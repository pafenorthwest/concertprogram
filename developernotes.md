# Design and Task

## Login Page

- Sign-In Top Bar
- Simple Username/Password Challenge

## Build Web Site

- Create Admin Control Panel (logout, edit listings)
- Create Admin Performer Listing Page
- Create Perform Lookup Page
- Create a empty web page listing all performers.

## Persist Data

- Redis for persisting records
- Create Test Data for Page

## Post Update

- Create Auth Token
- Web service post csv body with all performer data
- Web service get cvs body with all performer data

## Artist Schedule Page

- Lookup by enter 4 digit Base 36 code to access page
- Lookup by key details (Performers Last Name, Composer for piece, Teacher's Last Name)
- Able to edit all fields for their entry

## Arist Lottery Position

- Show position in lottery
- Project chances of chosen time slot being selected

## OAuth to Google PAFE Account

- Looks like a no-go for now. Requires verification with privacy and usage.
  - https://support.google.com/cloud/answer/6158849?hl=en
- Needs callback URL, best done with a separate domain

## Persist Cloud Document

- **ON HOLD requires OAUTH**
- _Button Persist data to google spreadsheet_
- _Button Generate Google Document from Template_

## Create Formatted Program

- Build up Document from Template and Spreadsheet
  - Headers
  - Correct Spacing
  - Correct font/size
