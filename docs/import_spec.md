# Import API

## Path

- Path: _/api/import_

## Methods

- PUT: Create or update entities. Entities created include Performer, Accompanist, Conributor, Musical Title, Performance. Entities updated include Performer and Performance. Contributor, Accompanist, or Musical Piece can only be created via this API, there are never updated.
- DELETE: Remove or delete Performer and the performer's associated Performance entries
- HEAD: Return only headers

## Headers

### `Request`

- Authorization: Bearer token
  Required to authenticate the request. See examples below

### `Response`

- Content-Type: application/json
  Returned in the response, the body may contain json with additional information.

## Response Codes

All HTTP Code

- 200: Successful DELETE or HEAD,
- 200: Successful PUT update previous entry updated with new values
- 201: Created no matching entry found imported for the first time
- 400: Bad request
- 401: No Authorization header
- 403: Bearer token not authorized or not correctly formated
- 404: Not-found URL does not exist
- 500: Service error

Note: Only when creating a new Performance or Performer record will return a 201.
Creating a new accompanist, cotributor, or musical title and updating and existing performance will return a 204.
Updates that change the value of a compose, musical title, or accompanist on an existing performance will return a 204.
A 200 response code is only required on a Successful DELETE or HEAD method.

## API

When sending a request is expected to contain json.

### `HEAD`

- Request - headers only body is empty
- Response - HTTP response code and headers

### `PUT`

#### `REQUEST`

**Required fields**

- className: string
- performerName: string
- lottery: 6 digit integer
- age: integer performer's age
- concert_series: string either "Eastside" or "Concerto"
- instrument: string
- musicalTitle: at least one
  - title: string
  - contributors: at least one
    - name: string
    - yearsActive: string format "birthYear - DeathYear" or "None"

**Optional fields**

- accompanist
- email
- phone

```json
{
	"className": "name_of_class",
	"performerName": "name_of_performer",
	"lottery": 0,
	"age": 0,
	"concert_series": "Eastside_or_Concerto",
	"instrument": "name_of_instrument",
	"musicalTitles": [
		{
			"title": "title_of_piece_with_movements_to_be_performed",
			"contributors": [
				{
					"name": "name_of_composer",
					"yearsActive": "birthYear - deathYear | None",
					"role": "Composer"
				}
			]
		}
	],
	"accompanist": "name_of_accompanist",
	"email": "email_address",
	"phone": "phone_number"
}
```

#### `RESPONSE`

**Success**
Along with a result field includes the ids of the performer and performance

```json
{
	"result": "success",
	"performerId": 0,
	"performanceId": 0
}
```

**Failure**

```json
{
	"result": "error",
	"reason": "message"
}
```

### DELETE

#### `REQUEST`

**Required fields**

- className: string
- performerName: string
- age: integer performer's age
- concert_series: string either "eastside" or "concerto"
- instrument: string

**Optional fields** these fields are ignored

- lottery: 6 digit integer
- musicalTitle: at least one
  - title: string
  - contributors: at least one
    - name: string
    - yearsActive: string format "birthYear - DeathYear" or "None"
- accompanist
- email
- phone

```json
{
	"className": "name_of_class",
	"performer_name": "name_of_performer",
	"age": 0,
	"concert_series": "eastside_or_concerto",
	"instrument": "name_of_instrument"
}
```

#### `RESPONSE`

**Success**
Along with a result field includes the ids of the performer and performance

```json
{
	"result": "success",
	"performerId": 0,
	"performanceId": 0
}
```

**Failure**

```json
{
	"result": "error",
	"reason": "message"
}
```

## Examples

### `Create a New Entry`

Headers:

- Authorization: Bearer xyz123
  Method:
- PUT
  Body:

```json
{
	"className": "WS.9-10.A",
	"performerName": "Natasja Filipek",
	"lottery": 123456,
	"age": 15,
	"concert_series": "Eastside",
	"instrument": "Flute",
	"musicalTitles": [
		{
			"title": "Poem",
			"contributors": [
				{
					"name": "Charles Griffes",
					"yearsActive": "1884 - 1920"
				}
			]
		}
	],
	"accompanist": "Tu, Shi",
	"email": "bPkR@example.com"
}
```

Response:
HTTP Response Code 201

```json
{
	"result": "success",
	"performerId": 12,
	"performanceId": 455
}
```

### `Update an Existing Entry`

Headers:

- Authorization: Bearer xyz123
  Method:
- PUT
  Body:

```json
{
	"className": "WS.9-10.A",
	"performerName": "Natasja Filipek",
	"lottery": 123456,
	"age": 15,
	"concert_series": "Eastside",
	"instrument": "Flute",
	"musicalTitles": [
		{
			"title": "Poem",
			"contributors": [
				{
					"name": "Charles Griffes",
					"yearsActive": "1884 - 1920"
				}
			]
		}
	],
	"accompanist": "Kim, Kyungsin"
}
```

Response:
HTTP Response Code 204

```json
{
	"result": "success",
	"performerId": 12,
	"performanceId": 455
}
```

### `Delete an Existing Entry`

Headers:

- Authorization: Bearer xyz123
  Method:
- DELETE
  Body:

```json
{
	"className": "WS.9-10.A",
	"performerName": "Natasja Filipek",
	"age": 15,
	"concert_series": "Eastside",
	"instrument": "Flute"
}
```

Response:
HTTP Response Code 200

```json
{
	"result": "success",
	"performerId": 12,
	"performanceId": 455
}
```
