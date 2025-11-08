# here i will explain how rest api node express js works

## Request Flow - From HTTP to Business Logic

### Request to create a new beneficiary

The frontend makes a POST request to /api/beneficiaries with a JSON body containing the beneficiary data. Express receives this request and starts passing it through your middleware chain. The JSON parser converts the request body into a JavaScript object. If you have authentication middleware, it verifies the JWT token and attaches user information to the request.
The request reaches your routes file, which matches the POST method and /api/beneficiaries path to a specific controller method. Controllers are classes or functions that handle the HTTP-specific aspects of the request. The controller extracts the data from the request body, perhaps validates it using a library like Zod or class-validator, and then calls the appropriate use case.
The use case is where your business logic lives. It receives the beneficiary data as a plain object or domain entity. It might check business rules, like verifying the student number doesn't already exist or that the curriculum year is valid. It uses a repository interface to interact with data persistence. The repository implementation, living in the infrastructure layer, translates this into actual database queries using your PostgreSQL client.
After the use case completes, it returns a result to the controller. This result might be the created beneficiary object, or it might be a special result type that indicates success or various types of failures. The controller translates this into an HTTP response, setting the appropriate status code, headers, and body format. If everything succeeded, it sends back a 201 Created status with the new beneficiary data in JSON format.

## Need to create a new enpoint explain the steps to create one

## How config files read from env variables
