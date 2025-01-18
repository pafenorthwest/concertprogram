# Import API

## Path
- Path: */api/import* 
- Example: schedule.pafenorthwest.org/api/import 

## Methods 
- POST: Create 
- DELETE: Remove 

## Headers 
- Authorization: Bearer token 
- Content-Type: application/json 

## Response Codes 
All HTTP Code 
- 201: created no matching entry found imported for the first time
- 204: updated previous entry updated with new values 
- 400: bad request
- 401: no Authorization header  
- 403: bearer token not authorized 
- 404: not-found URL does not exist 
- 500: service error 

## Body Format 
When sending a request the body is expected to contain json 
### `POST`
```json
{
  
}
```